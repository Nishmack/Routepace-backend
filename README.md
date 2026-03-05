# RoutePace Backend API

A full-featured Node.js/Express/MongoDB REST API for the RoutePace route sales and distribution management platform.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (Access + Refresh tokens)
- **Payments**: Stripe
- **Email**: Nodemailer (SMTP)
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate Limiting

---

## Project Structure

```
RoutePace-backend/
│
├── src/
│   ├── server.js              # Entry point - DB connection & server start
│   ├── app.js                 # Express app config, middleware, routes
│   │
│   ├── middleware/
│   │   ├── errorHandler.js    # Global error handler + AppError class
│   │   ├── auth.js            # JWT protect + restrictTo middleware
│   │   └── validators.js      # express-validator rules per route
│   │
│   ├── models/
│   │   ├── User.js            # Users (admin, manager, salesman, driver)
│   │   ├── Plan.js            # Pricing plans (Startup, Growing, Enterprise)
│   │   ├── Subscription.js    # User subscriptions + Stripe data
│   │   ├── DemoBooking.js     # Demo booking requests
│   │   ├── Contact.js         # Contact form submissions
│   │   ├── Route.js           # Delivery/sales routes with stops
│   │   ├── Inventory.js       # Products and stock management
│   │   ├── Invoice.js         # Invoices with line items
│   │   ├── Collection.js      # Payment collections
│   │   └── Customer.js        # Customer records
│   │
│   ├── controllers/
│   │   ├── authController.js         # Register, login, logout, password reset
│   │   ├── userController.js         # Profile + admin user management
│   │   ├── demoController.js         # Demo bookings (public + admin)
│   │   ├── contactController.js      # Contact form (public + admin)
│   │   ├── planController.js         # Pricing plans + seeding
│   │   ├── subscriptionController.js # Stripe checkout, trial, cancel
│   │   ├── routeController.js        # Route CRUD + stop updates + offline sync
│   │   ├── inventoryController.js    # Inventory CRUD + stock adjustments
│   │   ├── invoiceController.js      # Invoice CRUD + send + payment recording
│   │   ├── collectionController.js   # Payment collections + summaries
│   │   ├── reportController.js       # Dashboard + sales/collection/route reports
│   │   └── webhookController.js      # Stripe webhook event handler
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── demoRoutes.js
│   │   ├── contactRoutes.js
│   │   ├── planRoutes.js
│   │   ├── subscriptionRoutes.js
│   │   ├── routeRoutes.js
│   │   ├── inventoryRoutes.js
│   │   ├── invoiceRoutes.js
│   │   ├── collectionRoutes.js
│   │   ├── reportRoutes.js
│   │   └── webhookRoutes.js
│   │
│   └── utils/
│       ├── email.js           # Nodemailer + HTML email templates
│       └── helpers.js         # Response helpers, pagination, date utils
│
├── .env.example               # Environment variable template
├── package.json
└── README.md
```

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secrets, SMTP, and Stripe keys
```

### 3. Seed pricing plans

```bash
# After starting the server, call:
POST /api/plans/seed   (requires admin token)
```

### 4. Start the server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

---

## API Reference

### Authentication `(/api/auth)`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | Public | Register new user |
| POST | `/login` | Public | Login, returns JWT |
| POST | `/logout` | 🔒 | Invalidate refresh token |
| POST | `/refresh-token` | Public | Get new access token |
| GET | `/me` | 🔒 | Get current user |
| POST | `/forgot-password` | Public | Send reset email |
| PATCH | `/reset-password/:token` | Public | Reset password |
| PATCH | `/update-password` | 🔒 | Change password |

### Users `(/api/users)`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/profile` | 🔒 | Get my profile |
| PATCH | `/profile` | 🔒 | Update my profile |
| GET | `/` | 🔒 Admin | List all users |
| PATCH | `/:id` | 🔒 Admin | Update user role/status |
| DELETE | `/:id` | 🔒 Admin | Deactivate user |

### Demo Bookings `(/api/demos)`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Public | Book a demo |
| GET | `/` | 🔒 Admin | List all demo bookings |
| GET | `/stats` | 🔒 Admin | Demo booking statistics |
| PATCH | `/:id` | 🔒 Admin | Update demo status |

### Contact `(/api/contact)`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Public | Submit contact form |
| GET | `/` | 🔒 Admin | List all contacts |
| PATCH | `/:id` | 🔒 Admin | Update contact status |

### Plans `(/api/plans)`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Public | Get all active plans |
| GET | `/:id` | Public | Get single plan |
| POST | `/seed` | 🔒 Admin | Seed default plans |

### Subscriptions `(/api/subscriptions)`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/me` | 🔒 | Get my subscription |
| POST | `/checkout` | 🔒 | Create Stripe checkout session |
| POST | `/trial` | 🔒 | Start free trial |
| POST | `/cancel` | 🔒 | Cancel subscription |
| POST | `/reactivate` | 🔒 | Reactivate subscription |
| GET | `/billing-portal` | 🔒 | Get Stripe billing portal URL |

### Routes `(/api/routes)`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | 🔒 | List routes (filterable) |
| POST | `/` | 🔒 | Create route |
| POST | `/sync` | 🔒 | Sync offline routes |
| GET | `/:id` | 🔒 | Get single route |
| PATCH | `/:id` | 🔒 | Update route |
| DELETE | `/:id` | 🔒 | Delete route |
| PATCH | `/:id/location` | 🔒 | Update driver GPS location |
| PATCH | `/:id/stops/:stopId` | 🔒 | Update stop status/proof |

### Inventory `(/api/inventory)`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | 🔒 | List inventory |
| POST | `/` | 🔒 | Create product |
| GET | `/low-stock` | 🔒 | Get low stock alerts |
| GET | `/:id` | 🔒 | Get product |
| PATCH | `/:id` | 🔒 | Update product |
| DELETE | `/:id` | 🔒 | Soft delete product |
| POST | `/:id/adjust-stock` | 🔒 | Adjust warehouse/van stock |

### Invoices `(/api/invoices)`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | 🔒 | List invoices |
| POST | `/` | 🔒 | Create invoice (auto-numbering) |
| GET | `/:id` | 🔒 | Get invoice |
| PATCH | `/:id` | 🔒 | Update invoice |
| PATCH | `/:id/void` | 🔒 | Void invoice |
| POST | `/:id/send` | 🔒 | Send via email/WhatsApp |
| POST | `/:id/payment` | 🔒 | Record payment |

### Collections `(/api/collections)`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | 🔒 | List collections |
| POST | `/` | 🔒 | Record payment collection |
| GET | `/summary` | 🔒 | Get collection summary by period |
| GET | `/:id` | 🔒 | Get collection |
| POST | `/:id/reverse` | 🔒 | Reverse a collection |

### Reports `(/api/reports)`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/dashboard` | 🔒 | Dashboard overview stats |
| GET | `/sales` | 🔒 | Sales performance report |
| GET | `/collections` | 🔒 | Collection report |
| GET | `/routes` | 🔒 | Route performance report |

### Webhooks `(/api/webhooks)`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/stripe` | Stripe webhook handler |

---

## Environment Variables

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/routepace
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=30d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@routepace.com
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CLIENT_URL=http://localhost:3000
```

---

## User Roles

| Role | Permissions |
|------|-------------|
| `admin` | Full access to all resources + admin panels |
| `manager` | Full access to own org's data |
| `salesman` | Routes, invoices, collections |
| `driver` | View assigned routes, update stops |

---

## Key Features

- **JWT Auth** with access + refresh token rotation
- **Stripe Integration** for subscription billing with webhooks
- **Offline Sync** for mobile field agents
- **GPS Tracking** for real-time driver location
- **Proof of Delivery** with photo/signature capture
- **Auto Invoice Numbering** (INV-YYYYMM-0001)
- **Email Notifications** via SMTP with HTML templates
- **Rate Limiting** on all API and auth endpoints
- **Soft Deletes** for data safety
- **Aggregation Reports** for sales, collections, and routes
