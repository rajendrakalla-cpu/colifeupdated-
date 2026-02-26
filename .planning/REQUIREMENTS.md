# CoLife Requirements

## Active Milestones

### Milestone 1: Tenant Experience & Payments (Current)

**Goal:** Allow tenants to log in, view their assigned bed, and pay their rent via Razorpay.

- [ ] Implement Tenant Dashboard "Overview" tab.
- [ ] Implement Tenant Dashboard "My Payments" tab.
- [ ] Integrate Razorpay Checkout for the "Pay Now" button.
- [ ] Handle Razorpay webhooks/callbacks to mark Payments as `COMPLETED`.

### Milestone 2: Maintenance & Ticket Resolution

**Goal:** Complete the loop for maintenance tickets.

- [ ] Tenant UI to submit a new Ticket.
- [ ] Owner UI to view Open Tickets on the "Tickets" board.
- [ ] Owner UI to resolve a Ticket and optionally attach a custom Utility charge to the tenant's next invoice.

### Milestone 3: Move-Out & Settlement

**Goal:** Handle the tenant lifecycle end.

- [ ] Owner UI to process a Move-Out.
- [ ] Calculate deductions against the Security Deposit.
- [ ] Mark the Bed as `isOccupied: false` so it can be reassigned.
