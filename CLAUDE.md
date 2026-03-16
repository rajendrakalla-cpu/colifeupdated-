# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev              # Next.js dev server on :3000

# Build (runs prisma generate first)
npm run build

# Linting
npm run lint

# Database
npx prisma studio        # GUI to inspect/edit data
npx prisma migrate dev   # Apply schema changes locally
npx prisma db seed       # Seed with prisma/seed.ts

# Tests (requires running dev server + .env with real DB)
npm test                 # All tests (API + UI)
npm run test:api         # API tests only (no browser)
npm run test:ui          # Playwright Chromium UI tests
npm run test:install     # Install Playwright browsers (first-time)
npm run test:report      # Open last test HTML report
```

To run a single test file:
```bash
npx playwright test tests/api/recommendations.api.test.ts
```

## Architecture

### Stack
- **Next.js 16** App Router, React 19, TypeScript
- **Prisma** ORM → PostgreSQL (Neon in production)
- **Firebase** phone-based auth (client SDK + custom JWT)
- **Razorpay** payments with route-level split to owner accounts
- **Playwright** E2E tests (API + Chromium UI projects)

### Auth flow
1. Client: `signInWithPhoneNumber` (Firebase) → user enters OTP → `confirmationResult.confirm(otp)` → get Firebase ID token
2. `POST /api/v1/auth/verify-otp` verifies the Firebase ID token using X.509 certs from Google (`src/lib/firebase-admin.ts`) — **no Firebase Admin SDK / service account needed**
3. Server issues a short-lived **CoLife JWT** (HS256, 7 days, `JWT_SECRET`) via `src/lib/jwt.ts`
4. All subsequent requests send `Authorization: Bearer <colife_jwt>`
5. Middleware (`src/proxy.ts`, matched to `/api/:path*`) verifies the JWT and injects `x-user-id`, `x-user-email`, `x-user-role` headers into route handlers
6. Route handlers call `getUser(request)` from `src/lib/auth.ts` — this reads the injected header and does **one DB lookup** to get the full User record
7. Frontend stores the CoLife JWT in `localStorage` under key `colife_token`

Public API prefixes (no JWT required, but headers are injected when a valid token is present):
- `/api/v1/auth/` — login/register
- `/api/v1/properties` — property listing and detail
- `/api/v1/ai/` — AI recommendations
- `/api/v1/webhooks/` — Razorpay webhook
- `/api/cron/` — cron jobs (authenticated via `CRON_SECRET` header)

### Data model (key relationships)
```
User (TENANT | OWNER | ADMIN)
  └─ owns → Property
       └─ has → Room[]
            └─ has → Bed[]
                 └─ reserved by → Booking (tenantId, roomId, bedId)
                      └─ has → Payment[]
```
- `Booking.amount` = monthly rent; `Payment.amount` = individual payment (hold fee, monthly rent, utility, etc.)
- `Payment.invoiceType`: MOVE_IN | MONTHLY_RENT | UTILITY | ADHOC | SECURITY_DEPOSIT
- `Payment.status`: PENDING → CAPTURED (after Razorpay verify) | FAILED | REFUNDED
- Cash payments from owner get `razorpayPaymentId = "CASH_<timestamp>"` and status CAPTURED immediately
- LINK payments from owner create a PENDING record — tenant pays via Razorpay from dashboard

### API layer (`src/lib/api.ts`)
Typed client used by all frontend pages:
- `authApi`, `usersApi`, `propertiesApi`, `bookingsApi`, `ticketsApi`, `paymentsApi`, `notificationsApi`, `communityApi`, `adminApi`
- All requests automatically attach the JWT from `localStorage`

### Key booking/payment endpoints
| Endpoint | Purpose |
|---|---|
| `POST /api/v1/bookings/initiate` | Atomic: finds available bed, creates Booking + ₹500 hold Payment, returns Razorpay order |
| `POST /api/v1/payments/create-order` | Create Razorpay order for an existing Payment record |
| `POST /api/v1/payments/verify` | Verify Razorpay HMAC signature and mark Payment as CAPTURED |
| `POST /api/v1/payments/collect` | Owner records cash/link payment for a booking (ownership-validated) |
| `POST /api/v1/owner/properties/:id/assign-bed` | Owner manually assigns a bed to a tenant (creates Booking) |

### Pages and dashboards
- `/` — public landing
- `/properties` — searchable property listing
- `/properties/[id]` — property detail with Book Now / Schedule Visit / Chat with Manager (auth-gated; unauthenticated redirects to `/auth/login?redirect=...`)
- `/auth/login` — phone OTP login (Firebase)
- `/auth/register` — role selection + profile completion
- `/dashboard/tenant` — bookings, payments (Razorpay), tickets, community feed
- `/dashboard/owner` — properties, revenue ledger, tenants, tickets, settings
- `/dashboard/admin` — platform-wide user/property/payment management

### CSP (next.config.ts)
Firebase phone auth requires these domains in CSP:
- `script-src`: `www.google.com/recaptcha/`, `www.gstatic.com/recaptcha/`, `apis.google.com`
- `frame-src`: `www.google.com/recaptcha/`
- `connect-src`: `www.google.com`

### Tests
- `tests/global-setup.ts` creates 3 test users (TENANT, OWNER, ADMIN) + a property with rooms/beds in the real DB and writes tokens to `tests/fixtures/test-users.json`
- `tests/global-teardown.ts` deletes all test data in FK-safe order
- Test users identified by phones `+910000000001/2/3`; test property ID `test-property-e2e-id-00000001`
- `tests/helpers/fixtures.ts` — `loadFixtures()` reads the fixture JSON for use in tests
- Requires `TEST_BASE_URL` env var (defaults to `http://localhost:3000`) and a real running server + DB

### Environment variables
See `.env.example` for the full list. Critical ones:
- `DATABASE_URL` — Postgres connection string
- `JWT_SECRET` — must be ≥32 chars random hex
- `FIREBASE_PROJECT_ID` — used server-side for token verification (defaults to `colife-17952` if unset)
- `NEXT_PUBLIC_FIREBASE_*` — client SDK config
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET`

**Vercel env vars must not have trailing newlines** — this has caused `auth/operation-not-allowed` and JWT `unexpected "iss" claim` errors in the past.
