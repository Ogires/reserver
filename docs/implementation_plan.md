# Goal Description
Develop a B2B2C SaaS Booking System for "Trabajo de Fin de Máster" (TFM) focusing on Clean Architecture, TDD, and Maximum Software Quality. The system allows end-customers to book time slots and services from registered tenants (e.g., hair salons, physios) via a Next.js App Router frontend, utilizing Supabase for database/auth and Stripe for payments.

## Proposed Changes

### Configuration
#### [NEW] `package.json`
Dependencies for Next.js, Supabase, Stripe, Vitest, and Playwright.
#### [NEW] `.env.local`
API Keys for Supabase and Stripe.

---

### Database Layer (Supabase migrations)
#### [NEW] `supabase/migrations/00001_initial_schema.sql`
Tables for `tenants`, `services`, `schedules`, `bookings`, and `customers` with appropriate RLS policies.

---

### Domain Layer (Core)
#### [NEW] `src/core/domain/entities/Tenant.ts`
TypeScript interfaces for core entities.

---

### Application Layer (Core Use Cases)
#### [NEW] `src/core/application/use-cases/CheckAvailabilityUseCase.ts`
Availability calculation logic avoiding booking intersections within schedules.
#### [NEW] `src/core/application/use-cases/CreateBookingUseCase.ts`
Creating reserved slots and coordinating with the booking repository.
#### [NEW] `src/core/application/ports/IBookingRepository.ts`
Interface abstracts database persistence for decoupled testing.

---

### Infrastructure Layer (Adapters)
#### [NEW] `src/infrastructure/database/supabase/SupabaseBookingRepository.ts`
Booking persistence.
#### [NEW] `src/infrastructure/payments/stripe/StripePaymentService.ts`
Handling payments via Stripe Checkout.

---

### Presentation Layer (Next.js App Router)
#### [NEW] `src/app/actions/bookingActions.ts`
Server Actions acting as primary adapters to call Use Cases.
#### [NEW] `src/app/[tenantSlug]/page.tsx`
Main landing page for a tenant showing scheduling grids.
#### [NEW] `src/app/components/BookingGrid.tsx`
UI to display and select available time slots.
#### [NEW] `src/app/components/ServiceSelector.tsx`
UI to choose service upon slot selection.

## Verification Plan
### Automated Tests
- Run `vitest run` to execute unit tests specifically targeting the application use cases logic (`CheckAvailabilityUseCase` and overlapping prevention).
- Run Playwright E2E tests for the primary booking conversion funnel.

### Manual Verification
- Launch the application locally (`npm run dev`) to manually verify the flow of selecting a slot on a tenant page resulting in a successful booking creation.
