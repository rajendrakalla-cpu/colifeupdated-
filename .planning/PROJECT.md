# CoLife

## What This Is

CoLife is a comprehensive web application for managing co-living spaces, hostels, and PGs. It provides dual dashboards: an Owner Dashboard for managing properties, beds, rent collection, and tenant assignments, and a Tenant Dashboard for viewing bookings, paying rent, and raising maintenance tickets.

## Core Value

Connecting property owners with tenants through a seamless, transparent platform that centralizes bed assignments, rent tracking, and maintenance operations.

## Requirements

### Validated

- ✓ Local PostgreSQL database setup with Prisma ORM
- ✓ Prisma schema with User, Property, Room, Bed, Booking, Payment, and Ticket models
- ✓ Seed script for realistic mock data and testing
- ✓ Authentication structure (JWT-ready, currently using local OTP simulation)
- ✓ Owner Dashboard structure and tab navigation
- ✓ Add Property UI with Google Maps Places autocomplete for geolocation
- ✓ Property Overview tab with occupancy rate and revenue statistics
- ✓ Tenant Assignment Wizard (4-step flow: Personal, Lease, KYC, Payment)
- ✓ Unified Booking and Tenant user creation during assignment
- ✓ Rent Collection UI (Cash & simulated Payment Link)

### Active

- [ ] Complete Razorpay integration for real payment processing
- [ ] Implement Tenant Dashboard UI and "Pay Now" functionality
- [ ] Connect ticket raising from Tenant to Owner Dashboard resolution
- [ ] Tenant Move-Out workflow and deposit settlement computations
- [ ] Automated monthly rent invoice generation

### Out of Scope

- [Marketing site] — Focus is entirely on the application dashboards
- [Native Mobile Apps] — Focus is on a responsive PWA/web app first

## Context

- Building with Next.js App Router (React 18+)
- Prisma ORM is used for all database interactions. `prisma.$transaction` is heavily utilized for complex flows like tenant assignment to ensure data integrity.
- Tailwind CSS with specific global custom CSS variables.
- We recently implemented a robust 4-step Tenant Assignment Wizard.

## Constraints

- **Tech Stack**: Next.js App Router + Prisma + PostgreSQL — Standardized for quick iteration and type safety.
- **UI Framework**: Custom React components + Lucide Icons + Framer Motion — Avoiding heavy UI libraries to keep the bundle small and customizable.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Multi-step Wizard for Tenant Assignment | Standard modals were too cramped for the amount of data needed (KYC, Lease, Personal). | ✓ Good |
| Google Maps Autocomplete for Properties | Ensures accurate addresses and exact lat/lng coordinates for map search later. | ✓ Good |
| Atomic Transactions for Onboarding | Creating a user, booking, and updating bed status must succeed or fail together. | ✓ Good |

---
*Last updated: Today after GSD initialization*
