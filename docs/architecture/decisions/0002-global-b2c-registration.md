# Architectural Decision Record: Global B2C Customer Registration

## Status
Accepted

## Context
The SaaS Booking platform requires a way for end-users (customers) to optionally register an account to view and manage their booking history, rather than always checking out as a "Guest" via a magic link sent to their email. 

Two models were considered:
1. **Isolated B2B2C Registration (Per-Tenant):** Customers create a separate account for every tenant (business) they book with.
2. **Global B2C Registration:** Customers create a single, unified account on the SaaS platform itself.

## Decision
We have decided to implement **Global B2C Registration**.

### Reasoning
1. **Frictionless User Experience:** In modern SaaS ecosystems (e.g., Treatwell, Fresha, Mindbody), users expect to use a single identity across all businesses within the platform. Forcing a user to create a new password/account for "Barbershop A" and another for "Padel Club B", despite both using our software, creates unnecessary friction.
2. **Centralized History:** A global account allows us to build a centralized "Customer Portal" where users can see all their past and upcoming appointments across *all* tenants in one place.
3. **Platform Growth & Discovery (Network Effects):** A global customer base paves the way for future features like a "marketplace" or "discovery" portal, where registered users can find other businesses using the SaaS based on their geographic location or interests.
4. **Simplified Authentication:** We can leverage global providers seamlessly (Sign in with Google, Apple, etc.) without having to map those OAuth identities to isolated, per-tenant silos.

## Technical Consequences & Required Changes

1. **Database Schema Update:**
   - The `customers` table currently has a strict `tenant_id` foreign key. 
   - We need to refactor the data model so that `customers` are global entities.
   - The `tenant_id` must be removed from the `customers` table, or we must introduce a many-to-many relationship (e.g., `tenant_customers`) if we need to track specific tenant-customer relationships (like lifetime value per business). Alternatively, the relationship can purely be inferred through the `bookings` table (a customer has many bookings, and each booking belongs to a tenant).
   
2. **Authentication Flow:**
   - We need to implement a Customer Auth flow using Supabase Auth, distinct from the (B2B) Tenant Admin Auth flow.
   - We must ensure Row Level Security (RLS) is updated so that an authenticated customer can ONLY view their own bookings across all tenants, and a tenant can ONLY view bookings made for their business.

3. **Booking Flow Update:**
   - The booking form (`BookingInterface.tsx`) should detect if a customer is logged in. If they are, it should auto-fill their details and associate the new booking with their global customer ID.
   - If they check out as a guest, we will still create a customer record (or link to an existing one by email) to ensure data consistency, but they won't have a login password until they explicitly "claim" or create an account with that email.

4. **New Portal UI:**
   - Development of a new B2C Customer Intranet (e.g., `/portal` or similar routing) where logged-in users can view their history and manage bookings without needing the unique `management_token` for every single booking.
