---
description: "Razorpay Checkout and Webhook Integration"
labels: ["backend", "payments"]
depends_on: ["01-frontend-PLAN.md"]
files_modified: [
  "src/app/api/v1/payments/create-order/route.ts",
  "src/app/api/v1/webhooks/razorpay/route.ts",
  "src/app/dashboard/tenant/page.tsx",
  "src/app/globals.css"
]
wave: 2
---

## Objective
Implement a secure, live Razorpay checkout flow so Tenants can click "Pay Now", view the Razorpay modal, and successfully pay. Process webhooks to mark invoices as closed.

## Requirements
- Create an API route to generate a `razorpayOrderId`.
- Handle the `payment.captured` webhook from Razorpay to safely update the `Payment` record status in PostgreSQL to `'COMPLETED'`.
- Pass a split payload instruction so Owners automatically get routed their rent, minus the platform's cut, instantly to their Linked Account (simulated or real Route setup).

## Tasks
1. `src/app/api/v1/payments/create-order/route.ts`:
   - POST route that accepts a `paymentId`.
   - Uses the Razorpay Node SDK to call `razorpay.orders.create()`.
   - If the property owner has a `razorpayLinkedAccountId`, inject `transfers` instruction so rent splits.
2. `src/app/dashboard/tenant/page.tsx`:
   - On the "Pay Now" button click, call the `create-order` endpoint.
   - Load the Razorpay Checkout script dynamically.
   - Launch the checkout overlay. On success, show a nice Framer Motion success animation.
3. `src/app/api/v1/webhooks/razorpay/route.ts`:
   - Secure POST route verifying the `x-razorpay-signature`.
   - On `payment.captured` event, fetch the associated DB payment ID from `payload.payment.entity.notes`.
   - Update Prisma payment status.

## Verification
- [ ] Clicking "Pay Now" on a pending invoice correctly opens the Razorpay modal.
- [ ] Entering Razorpay test card data completes the simulated payment.
- [ ] The database payment status changes from `PENDING` to `COMPLETED` or `CAPTURED`.
