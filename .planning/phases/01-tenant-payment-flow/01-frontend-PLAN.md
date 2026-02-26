---
description: "Implement Tenant Dashboard Overview and Payments Tab"
labels: ["frontend", "ui"]
depends_on: []
files_modified: [
  "src/app/dashboard/tenant/page.tsx",
  "src/app/api/v1/tenant/payments/route.ts"
]
wave: 1
---

## Objective
Build the Tenant Dashboard interface so tenants can log in, see their assigned room/bed, and view their pending invoices. 

## Requirements
- Render an "Overview" tab displaying the tenant's current active booking details (Room, Bed, Monthly Rent).
- Render a "My Payments" tab listing all invoices (Pending, Captured, Completed).
- Add a prominent "Pay Now" button on pending invoices.

## Tasks
1. `src/app/dashboard/tenant/page.tsx`:
   - Extend the existing tenant page to fetch the logged-in user's `bookings` and `payments`.
   - Implement tab switching between 'overview', 'payments', and 'tickets' (leave tickets placeholder for now).
   - In the 'overview' tab, beautifully display their current assignment details.
   - In the 'payments' tab, list out `payments` using a clean table or card layout.
2. `src/app/api/v1/tenant/payments/route.ts`:
   - Create a GET route to securely fetch payments belonging only to the authenticated tenant.

## Verification
- [ ] Logging in as a test tenant (`tenant1@colife.com`) successfully routes to `/dashboard/tenant`.
- [ ] The dashboard renders the correct Room and Bed assignment.
- [ ] The Payments tab shows at least one pending invoice (from the Move-In flow).
