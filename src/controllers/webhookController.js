const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Subscription = require("../models/Subscription");
const Plan = require("../models/Plan");
const User = require("../models/User");
const { sendEmail } = require("../utils/email");

exports.handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const { userId, planId, billingCycle } = session.metadata;

        if (session.mode === "subscription") {
          const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);
          const plan = await Plan.findById(planId);

          const subscription = await Subscription.findOneAndUpdate(
            { user: userId },
            {
              plan: planId,
              status: stripeSubscription.status,
              billingCycle,
              stripeSubscriptionId: stripeSubscription.id,
              stripeCustomerId: session.customer,
              currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
              currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
              trialEnd: stripeSubscription.trial_end
                ? new Date(stripeSubscription.trial_end * 1000)
                : undefined,
            },
            { upsert: true, new: true }
          );

          await User.findByIdAndUpdate(userId, { subscription: subscription._id });

          const user = await User.findById(userId);
          if (user) {
            await sendEmail({
              to: user.email,
              subject: "Your RoutePace Subscription is Active!",
              template: "subscriptionActive",
              data: { name: user.name, planName: plan?.displayName },
            }).catch(console.error);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const stripeSubscription = event.data.object;
        await Subscription.findOneAndUpdate(
          { stripeSubscriptionId: stripeSubscription.id },
          {
            status: stripeSubscription.status,
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          }
        );
        break;
      }

      case "customer.subscription.deleted": {
        const stripeSubscription = event.data.object;
        const subscription = await Subscription.findOneAndUpdate(
          { stripeSubscriptionId: stripeSubscription.id },
          { status: "canceled", canceledAt: new Date() },
          { new: true }
        );

        if (subscription) {
          const user = await User.findById(subscription.user);
          if (user) {
            await sendEmail({
              to: user.email,
              subject: "Your RoutePace Subscription has been Cancelled",
              template: "subscriptionCancelled",
              data: { name: user.name },
            }).catch(console.error);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subscription = await Subscription.findOneAndUpdate(
          { stripeSubscriptionId: invoice.subscription },
          { status: "past_due" },
          { new: true }
        );

        if (subscription) {
          const user = await User.findById(subscription.user);
          if (user) {
            await sendEmail({
              to: user.email,
              subject: "Payment Failed - Action Required",
              template: "paymentFailed",
              data: { name: user.name },
            }).catch(console.error);
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        await Subscription.findOneAndUpdate(
          { stripeSubscriptionId: invoice.subscription },
          { status: "active" }
        );
        break;
      }

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    res.status(500).json({ error: "Webhook handler failed" });
  }
};
