# TableFlow — Backend API

> A multi-tenant, QR-based restaurant ordering and management SaaS platform backend, built as the RAD coursework project for ITS2020.

**Live API:** [https://tableflow-backed-production.up.railway.app](https://tableflow-backed-production.up.railway.app)

---

## Overview

TableFlow is a complete restaurant ordering system that allows customers to scan a QR code at their table, browse the menu, place an order, and track its status in real time — while restaurant staff manage the entire order lifecycle through dedicated Kitchen, Waiter, and Cashier portals. A Super Admin portal handles restaurant onboarding and platform-wide oversight.

This repository contains the **backend REST API + Socket.io real-time server**.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Language | TypeScript |
| Database | MongoDB (Mongoose) |
| Validation | Zod |
| Authentication | JWT (access + refresh tokens) |
| Password Hashing | bcryptjs |
| Real-time | Socket.io |
| Payments | Stripe |
| Email | Nodemailer |
| PDF Generation | PDFKit |
| QR Codes | qrcode |
| Package Manager | pnpm |
| Hosting | Railway |

---

## Core Features

- **Multi-tenant architecture** — every restaurant's data is fully isolated by `restaurantId`
- **Role-based access control** — Super Admin, Restaurant Admin, Kitchen, Waiter, Cashier
- **QR-based customer ordering** — no login required for customers
- **Real-time order lifecycle** via Socket.io — kitchen, waiter, and cashier dashboards update instantly
- **Stripe payment integration** with webhook handling
- **Server-side price calculation** — client-submitted prices are never trusted
- **Automated PDF bill generation**
- **Super Admin restaurant approval workflow** with immutable audit logging
- **Analytics dashboards** for both restaurant admins and platform super admin
- **Onboarding checklist** to guide new restaurants through setup

---

## Architecture

### User Roles

| Role | Access |
|------|--------|
| Super Admin | Approve/reject/suspend restaurants, platform analytics, audit log |
| Restaurant Admin | Manage categories, menu, tables, staff, view restaurant analytics |
| Kitchen | View and process incoming orders |
| Waiter | Claim and deliver completed orders |
| Cashier | Process payments, issue bills |
| Customer | No account — scans QR, orders, tracks status |

### Order Lifecycle

```
placed → preparing → completed → delivered → (paid)
   ↓
rejected
```

Each transition emits a Socket.io event to the relevant role-based room so dashboards update without polling.

---

## Project Structure

```
src/
├── config/          # Environment validation (Zod) + MongoDB connection
├── models/          # Mongoose schemas
├── schemas/         # Zod request validation schemas
├── middleware/       # Auth, role guard, tenant isolation, validation, error handling
├── controllers/     # Route handler logic
├── routes/           # Express routers (superadmin / public / restaurant)
├── sockets/          # Socket.io server + room management
├── utils/            # JWT, password hashing, email, QR generation, PDF bills, audit logging
├── types/            # Express request type augmentation
├── seed/             # Super Admin seed script
└── index.ts          # App entry point
```

---

## API Modules

| Module | Description |
|--------|-------------|
| Super Admin Auth | Separate JWT-secured login for platform administration |
| Restaurant Registration | Public application form for new restaurants |
| Registration Management | Super Admin approve / reject / suspend / reactivate workflow |
| Staff Auth | Login, forced first-login password change, token refresh |
| Categories | Menu category CRUD |
| Menu Items | Menu item CRUD + public customer-facing menu endpoint |
| Tables | Table CRUD with auto-generated QR codes |
| Staff Management | Restaurant admin manages kitchen/waiter/cashier accounts |
| Orders | Customer order placement with server-side price calculation |
| Kitchen Portal | Approve / reject / complete orders |
| Waiter Portal | Claim and deliver orders |
| Cashier Portal | Cash payment confirmation, bill download |
| Stripe Payments | Card payment intent creation + webhook handling |
| Super Admin Restaurant Management | View, delete, reset password for any restaurant |
| Analytics | Revenue, order volume, peak hours, top items (restaurant + platform level) |
| Onboarding | First-login setup checklist for new restaurant admins |

---

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/tableflow

JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

SUPERADMIN_JWT_SECRET=
SUPERADMIN_JWT_EXPIRY=4h
SUPERADMIN_EMAIL=superadmin@tableflow.com

BCRYPT_SALT_ROUNDS=12

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

FRONTEND_URL=https://table-flow-frontend.vercel.app
TAX_RATE=0.1
NODE_ENV=production
```

All environment variables are validated at startup using Zod — the server will refuse to start if any required variable is missing or malformed.

---

## Getting Started Locally

### Prerequisites
- Node.js 18+
- pnpm
- A MongoDB connection string (local or Atlas)

### Installation

```bash
git clone <repository-url>
cd tableflow-backend
pnpm install
```

### Setup

1. Create `.env` using the template above
2. Seed the Super Admin account:
   ```bash
   pnpm seed
   ```
3. Start the development server:
   ```bash
   pnpm dev
   ```

Server runs at `http://localhost:5000`. Health check: `GET /health`

### Build for Production

```bash
pnpm build
pnpm start
```

---

## API Response Format

**Success:**
```json
{ "success": true, "data": { }, "message": "optional" }
```

**Paginated:**
```json
{
  "success": true,
  "data": [],
  "pagination": { "page": 1, "limit": 20, "total": 150, "pages": 8 }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": [{ "field": "email", "message": "Invalid email" }]
}
```

---

## Real-time Events (Socket.io)

| Event | Emitted To | Trigger |
|-------|-----------|---------|
| `new_order` | Kitchen, Waiter rooms | Customer places order |
| `order_approved` | Order room | Kitchen approves order |
| `order_rejected` | Order room | Kitchen rejects order |
| `order_completed` | Waiter room | Kitchen marks order ready |
| `order_claimed` | Waiter room | A waiter claims an order |
| `order_delivered` | Order room | Waiter delivers order |
| `payment_success` | Cashier, Order rooms | Cash or card payment confirmed |

---

## Deployment

Deployed on **Railway**. Build command: `pnpm install && pnpm build`. Start command: `pnpm start`.

Live API: **https://tableflow-backed-production.up.railway.app**

Companion frontend repository deployed on Vercel: **https://table-flow-frontend.vercel.app**

---

## Notes

- All prices are calculated server-side at order time — client-submitted prices are ignored to prevent tampering.
- AuditLog entries are immutable — no update or delete operations exist for this collection.
- Email delivery failures never block a request — all emails are sent fire-and-forget.
- Stripe webhook route uses raw request body parsing (required for signature verification) and is excluded from the global JSON body parser.
