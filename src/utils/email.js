const nodemailer = require("nodemailer");

// ─── Create Transporter ───────────────────────────────────────────────────────
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// ─── Email Templates ──────────────────────────────────────────────────────────
const getEmailTemplate = (template, data) => {
  const baseStyle = `
    font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;
    background: #ffffff; border-radius: 8px; overflow: hidden;
  `;
  const headerStyle = `
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    padding: 30px; text-align: center;
  `;
  const bodyStyle = `padding: 30px; color: #333;`;
  const btnStyle = `
    display: inline-block; background: #3b82f6; color: white;
    padding: 12px 30px; border-radius: 6px; text-decoration: none;
    font-weight: bold; margin: 20px 0;
  `;
  const footerStyle = `
    background: #f8f9fa; padding: 20px; text-align: center;
    color: #666; font-size: 12px;
  `;

  const logo = `<h1 style="color: white; margin: 0; font-size: 28px;">Route<span style="color: #3b82f6;">Pace</span></h1>`;

  const templates = {
    welcome: {
      subject: "Welcome to RoutePace!",
      html: `
        <div style="${baseStyle}">
          <div style="${headerStyle}">${logo}</div>
          <div style="${bodyStyle}">
            <h2>Welcome, ${data.name}! 🎉</h2>
            <p>Your RoutePace account for <strong>${data.companyName}</strong> is ready.</p>
            <p>You can now start optimizing your routes, managing inventory, and collecting payments smarter.</p>
            <a href="${process.env.CLIENT_URL}/dashboard" style="${btnStyle}">Go to Dashboard →</a>
            <p>Need help? Reply to this email or check our documentation.</p>
          </div>
          <div style="${footerStyle}">© 2024 RoutePace Inc. All rights reserved.</div>
        </div>
      `,
    },
    passwordReset: {
      subject: "Reset Your RoutePace Password",
      html: `
        <div style="${baseStyle}">
          <div style="${headerStyle}">${logo}</div>
          <div style="${bodyStyle}">
            <h2>Reset Your Password</h2>
            <p>Hi ${data.name},</p>
            <p>You requested a password reset. Click the button below to set a new password.</p>
            <a href="${data.resetURL}" style="${btnStyle}">Reset Password →</a>
            <p style="color: #999; font-size: 13px;">This link expires in ${data.expiresIn}. If you didn't request this, ignore this email.</p>
          </div>
          <div style="${footerStyle}">© 2024 RoutePace Inc.</div>
        </div>
      `,
    },
    demoConfirmation: {
      subject: "Your RoutePace Demo is Confirmed!",
      html: `
        <div style="${baseStyle}">
          <div style="${headerStyle}">${logo}</div>
          <div style="${bodyStyle}">
            <h2>Demo Request Received! ✅</h2>
            <p>Hi ${data.fullName},</p>
            <p>Thank you for your interest in RoutePace. We've received your demo request for <strong>${data.companyName}</strong>.</p>
            <p>Our team will reach out within <strong>24 hours</strong> to schedule your personalized demo.</p>
            <p>In the meantime, explore our features at routepace.com.</p>
          </div>
          <div style="${footerStyle}">© 2024 RoutePace Inc.</div>
        </div>
      `,
    },
    contactAutoReply: {
      subject: "We received your message - RoutePace",
      html: `
        <div style="${baseStyle}">
          <div style="${headerStyle}">${logo}</div>
          <div style="${bodyStyle}">
            <h2>Message Received! 📬</h2>
            <p>Hi ${data.fullName},</p>
            <p>We've received your message and our team will get back to you within <strong>24 hours</strong>.</p>
            <p>Need urgent help? Call us at <strong>+1 (555) ROUTE-PC</strong>.</p>
          </div>
          <div style="${footerStyle}">© 2024 RoutePace Inc.</div>
        </div>
      `,
    },
    newDemoAlert: {
      subject: `New Demo Booking: ${data.companyName}`,
      html: `
        <div style="${baseStyle}">
          <div style="${headerStyle}">${logo}<p style="color:#aaa;margin:5px 0 0">New Demo Booking</p></div>
          <div style="${bodyStyle}">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Name</td><td style="padding:8px;border-bottom:1px solid #eee;">${data.fullName}</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Company</td><td style="padding:8px;border-bottom:1px solid #eee;">${data.companyName}</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Email</td><td style="padding:8px;border-bottom:1px solid #eee;">${data.businessEmail}</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Phone</td><td style="padding:8px;border-bottom:1px solid #eee;">${data.phoneNumber}</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Country</td><td style="padding:8px;border-bottom:1px solid #eee;">${data.country}</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Business Type</td><td style="padding:8px;border-bottom:1px solid #eee;">${data.businessType}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;">Drivers</td><td style="padding:8px;">${data.numberOfDrivers}</td></tr>
            </table>
          </div>
        </div>
      `,
    },
    newContactAlert: {
      subject: `New Contact: ${data.fullName}`,
      html: `
        <div style="${baseStyle}">
          <div style="${headerStyle}">${logo}</div>
          <div style="${bodyStyle}">
            <h3>New Contact Inquiry</h3>
            <p><strong>From:</strong> ${data.fullName} (${data.companyName})</p>
            <p><strong>Email:</strong> ${data.businessEmail}</p>
            <p><strong>Phone:</strong> ${data.phoneNumber}</p>
            <hr/>
            <p><strong>Message:</strong></p>
            <p style="background:#f5f5f5;padding:15px;border-radius:4px;">${data.message}</p>
          </div>
        </div>
      `,
    },
    subscriptionActive: {
      subject: "Your RoutePace Subscription is Active!",
      html: `
        <div style="${baseStyle}">
          <div style="${headerStyle}">${logo}</div>
          <div style="${bodyStyle}">
            <h2>Subscription Active! 🚀</h2>
            <p>Hi ${data.name}, your <strong>${data.planName}</strong> plan is now active.</p>
            <a href="${process.env.CLIENT_URL}/dashboard" style="${btnStyle}">Start Optimizing →</a>
          </div>
          <div style="${footerStyle}">© 2024 RoutePace Inc.</div>
        </div>
      `,
    },
    subscriptionCancelled: {
      subject: "Your RoutePace Subscription Cancelled",
      html: `
        <div style="${baseStyle}">
          <div style="${headerStyle}">${logo}</div>
          <div style="${bodyStyle}">
            <h2>Subscription Cancelled</h2>
            <p>Hi ${data.name}, your subscription has been cancelled.</p>
            <p>You can reactivate anytime from your billing settings.</p>
            <a href="${process.env.CLIENT_URL}/pricing" style="${btnStyle}">Resubscribe →</a>
          </div>
          <div style="${footerStyle}">© 2024 RoutePace Inc.</div>
        </div>
      `,
    },
    paymentFailed: {
      subject: "Action Required: Payment Failed",
      html: `
        <div style="${baseStyle}">
          <div style="${headerStyle}">${logo}</div>
          <div style="${bodyStyle}">
            <h2>Payment Failed ⚠️</h2>
            <p>Hi ${data.name}, we couldn't process your payment.</p>
            <p>Please update your payment method to continue using RoutePace.</p>
            <a href="${process.env.CLIENT_URL}/dashboard/billing" style="${btnStyle}">Update Payment →</a>
          </div>
          <div style="${footerStyle}">© 2024 RoutePace Inc.</div>
        </div>
      `,
    },
  };

  return templates[template] || null;
};

// ─── Send Email ───────────────────────────────────────────────────────────────
exports.sendEmail = async ({ to, subject, template, data, html, text }) => {
  try {
    const transporter = createTransporter();

    let emailHtml = html;
    let emailSubject = subject;

    if (template && data) {
      const tmpl = getEmailTemplate(template, data);
      if (tmpl) {
        emailHtml = tmpl.html;
        emailSubject = tmpl.subject || subject;
      }
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "RoutePace"}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to,
      subject: emailSubject,
      html: emailHtml,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error("Email send error:", err.message);
    throw err;
  }
};
