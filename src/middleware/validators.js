const { validationResult, body, param, query } = require("express-validator");
const { AppError } = require("./errorHandler");

/**
 * Run validation and return errors if any
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors
      .array()
      .map((e) => e.msg)
      .join(". ");
    return next(new AppError(messages, 400));
  }
  next();
};

// ─── Auth Validators ──────────────────────────────────────────────────────────
const registerValidator = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ min: 2, max: 100 }),
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain uppercase, lowercase, and a number"),
  body("companyName").trim().notEmpty().withMessage("Company name is required"),
  body("phone").optional().isMobilePhone().withMessage("Valid phone number required"),
  validate,
];

const loginValidator = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  validate,
];

// ─── Demo Validators ──────────────────────────────────────────────────────────
const demoBookingValidator = [
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  body("companyName").trim().notEmpty().withMessage("Company name is required"),
  body("businessEmail").isEmail().normalizeEmail().withMessage("Valid business email is required"),
  body("phoneNumber").trim().notEmpty().withMessage("Phone number is required"),
  body("country").trim().notEmpty().withMessage("Country is required"),
  body("businessType").trim().notEmpty().withMessage("Business type is required"),
  body("numberOfDrivers").optional().isString().withMessage("Number of drivers must be a positive integer"),
  body("specialRequirements").optional().trim().isLength({ max: 1000 }),
  validate,
];

// ─── Contact Validators ───────────────────────────────────────────────────────
const contactValidator = [
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  body("companyName").trim().notEmpty().withMessage("Company name is required"),
  body("businessEmail").isEmail().normalizeEmail().withMessage("Valid business email is required"),
  body("phoneNumber").trim().notEmpty().withMessage("Phone number is required"),
  body("country").trim().notEmpty().withMessage("Country is required"),
  body("businessType").trim().notEmpty().withMessage("Business type is required"),
  body("message").trim().notEmpty().withMessage("Message is required").isLength({ max: 2000 }),
  validate,
];

// ─── Route Validators ─────────────────────────────────────────────────────────
const routeValidator = [
  body("name").trim().notEmpty().withMessage("Route name is required"),
  body("stops").isArray({ min: 1 }).withMessage("At least one stop is required"),
  body("stops.*.address").trim().notEmpty().withMessage("Each stop must have an address"),
  body("assignedDriver").optional().isMongoId().withMessage("Invalid driver ID"),
  validate,
];

// ─── Inventory Validators ─────────────────────────────────────────────────────
const inventoryValidator = [
  body("productName").trim().notEmpty().withMessage("Product name is required"),
  body("sku").trim().notEmpty().withMessage("SKU is required"),
  body("quantity").isInt({ min: 0 }).withMessage("Quantity must be a non-negative integer"),
  body("unit").trim().notEmpty().withMessage("Unit is required"),
  body("price").isFloat({ min: 0 }).withMessage("Price must be a non-negative number"),
  validate,
];

// ─── Invoice Validators ───────────────────────────────────────────────────────
const invoiceValidator = [
  body("customerId").isMongoId().withMessage("Valid customer ID is required"),
  body("items").isArray({ min: 1 }).withMessage("At least one item is required"),
  body("items.*.productId").isMongoId().withMessage("Valid product ID required for each item"),
  body("items.*.quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
  body("items.*.unitPrice").isFloat({ min: 0 }).withMessage("Unit price must be non-negative"),
  body("dueDate").isISO8601().withMessage("Valid due date is required"),
  validate,
];

// ─── Collection Validators ────────────────────────────────────────────────────
const collectionValidator = [
  body("invoiceId").isMongoId().withMessage("Valid invoice ID is required"),
  body("amount").isFloat({ min: 0.01 }).withMessage("Amount must be greater than 0"),
  body("paymentMethod").isIn(["cash", "cheque", "bank_transfer", "upi", "card", "other"]).withMessage("Invalid payment method"),
  validate,
];

// ─── Subscription Validators ──────────────────────────────────────────────────
const subscriptionValidator = [
  body("planId").isMongoId().withMessage("Valid plan ID is required"),
  body("billingCycle").isIn(["monthly", "yearly"]).withMessage("Billing cycle must be monthly or yearly"),
  validate,
];

module.exports = {
  validate,
  registerValidator,
  loginValidator,
  demoBookingValidator,
  contactValidator,
  routeValidator,
  inventoryValidator,
  invoiceValidator,
  collectionValidator,
  subscriptionValidator,
};
