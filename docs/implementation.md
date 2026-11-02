# Implementation Tracking

Source: [PRD v1.0](prd.md). Updated **2 November 2026**.

**Status: application code implemented; final runtime verification and external submission remain open.** A passing build or SQLite suite does not establish MySQL concurrency or browser behavior.

## Scope

The implementation follows the PRD: one internal workshop, Bay 1–4, and the `api/` + `web/` structure. Authentication, tenancy, billing, notifications, deployment and CI/CD are excluded. Billo informed the backend bootstrap and availability predicate; its domain-specific booking lifecycle and PostgreSQL tenancy were not imported.

## Functional requirements

| Requirement | Implementation | Evidence / remaining verification |
|---|---|---|
| FR-01 Booking CRUD and cancellation | Done | Laravel resource routes and feature tests; Next.js list/detail/forms and actions |
| FR-02 Fields, validation, indexes, UTC | Done | Migration, Form Requests, resource serialization, feature tests |
| FR-03 Pending/confirmed/cancelled behavior | Done | Status validation, reactivation rejection and cancellation tests |
| FR-04 Concurrent overlap prevention | Implemented | Transactions, permanent bay row locks, current reads, deadlock retries; MySQL race test blocked in sandbox |
| FR-05 List, pagination and status filters | Done | Server Component, status links, ten-row API pagination, preserved URL parameters; browser execution pending |
| FR-06 Details and missing records | Done | All booking fields displayed; `getBooking` calls `notFound()` for invalid/missing IDs; browser execution pending |
| FR-07 Create and inline errors | Done | Server Action, Laravel error mapping, retained values and conflict feedback; action tests pass |
| FR-08 Edit and refresh | Done | Server-fetched initial values, Melbourne-local inputs, PUT action and path revalidation; action tests pass |
| FR-09 Cancel/delete confirmations | Done | Native modal dialog, distinct PATCH/DELETE actions and redirects; action tests pass, browser execution pending |
| FR-10 Melbourne timezone and DST | Done | UTC conversion/display and explicit rejection of missing/repeated local times; 14 timezone tests pass |

## Implementation map

| Responsibility | Files |
|---|---|
| HTTP API | `api/routes/api.php`, `api/app/Http/Controllers/Api/BookingController.php` |
| Validation and serialization | `api/app/Http/Requests/`, `api/app/Http/Resources/BookingResource.php` |
| Transactions and locking | `api/app/Services/BookingService.php` |
| Storage and sample data | `api/database/migrations/`, `api/database/seeders/DatabaseSeeder.php` |
| Initial server data | `web/app/bookings/`, `web/lib/bookings.ts`, `web/lib/api.ts` |
| Mutations and revalidation | `web/app/actions/bookings.ts` |
| Interactive forms and dialogs | `web/components/bookings/booking-form.tsx`, `booking-actions.tsx` |
| Shared types and timezone | `web/types/booking.ts`, `web/lib/timezone.ts` |
| Loading/error/empty/404 states | Route state files under `web/app/bookings/`; list empty state in its Server Component |

## Verification log

| Check | Result |
|---|---|
| `cd api && composer validate --strict` | Passed in final checks |
| `cd api && php artisan test --compact` | Passed: **32 tests, 95 assertions**, SQLite |
| `cd api && vendor/bin/pint --test` | Passed |
| `cd web && bun install --frozen-lockfile` | Passed; lockfile unchanged |
| `cd web && bun run test` | Passed: **26 tests, 51 assertions** |
| `cd web && bun run lint` | Passed |
| `cd web && bun run typecheck` | Passed |
| `cd web && bun run build` | Passed; list/detail/edit are dynamic server routes |
| Impeccable source detector | Passed with no findings; not a visual/browser inspection |
| MySQL independent-process race test | **Blocked**: PDO connection returns `Operation not permitted` before assertions |
| Desktop/mobile Playwright suite | **Blocked**: API fixture migrates/seeds, but PHP cannot listen on `127.0.0.1:18000` in the sandbox |
| Rendered desktop/mobile review | **Blocked**: local Chrome launch aborts in the sandbox; screenshots were not produced |

### PRD test coverage

- **T01–T07:** creation, required/invalid values, invalid time ranges, bays and statuses in `api/tests/Feature/BookingTest.php`.
- **T08–T15:** overlapping active bookings, adjacent/different bays, cancellation, moving to an occupied bay, self-exclusion and reactivation tests in the same file.
- **T16–T19:** filtering, pagination/order, missing records and permanent deletion tests in the same file.
- **T20:** `api/tests/Concurrency/BookingConcurrencyTest.php` plus independent workers in `tests/Support/competing-booking.php`. Test exists, execution blocked; **not verified**.
- **Frontend additions:** 12 Server Action tests cover API methods, UTC payloads, field-error/value retention, offline/server/missing-record errors, confirmation requirements, invalidation and redirect behavior. Fourteen timezone cases cover summer/winter offsets and DST boundaries.
- **Browser scenarios:** ten tests across desktop and mobile projects cover CRUD, confirmations, conflict retention/focus, filtering, pagination, DST errors, missing records and empty pages. Discovered/typechecked, not executed successfully.

## Engineering choices

- Route-specific loading skeletons mirror the list (ten rows, filters, pagination), detail, and new/edit form layouts. They reuse responsive page classes, expose a single loading announcement, and disable animation for reduced-motion preferences.

- All reads use server-only HTTP helpers with `no-store`; the browser never accesses MySQL.
- Successful actions revalidate list/detail/edit paths and redirect without a full reload.
- Action state preserves failed form submissions; pending controls prevent duplicate submissions.
- Confirmation dialogs distinguish cancellation from deletion. The detail page keys actions by booking status so cancellation closes its dialog after navigation.
- MySQL connections explicitly select InnoDB and UTC. The destination bay is locked even when no booking exists; updates reload the booking before merging partial fields. Transaction deadlocks retry up to five times.
- A production Webpack build avoids auxiliary Turbopack loader ports in this environment. CSS and Tailwind style locally owned shadcn/ui selects and date pickers; local font fallbacks avoid external font requests. Laravel validation remains authoritative.

## Remaining acceptance work

- [ ] Run Laravel migrations/seeding against the intended MySQL instance and verify local startup.
- [ ] Create the disposable `caravan_workshop_test` database and pass T20 using the README command outside the sandbox.
- [ ] Run `bun run test:e2e` outside the sandbox and resolve any runtime failures.
- [ ] Inspect desktop and mobile views, keyboard navigation, validation focus and confirmation dialogs in a real browser.
- [ ] Verify a clean-clone setup from the README.
- [ ] Record the screen-and-voice Loom walkthrough with transcript and public-link access.
- [ ] Verify/publish the intended public repository and submit both links before the deadline.

Follow PRD §13 for the five-minute walkthrough. Do not mark readiness complete until the MySQL and browser checks pass and the external deliverables exist.
