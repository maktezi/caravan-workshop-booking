# Implementation Tracking

Source: [PRD](prd.md). Updated **3 November 2026**.

**Status: application task implemented and runtime checks passed; external application materials remain open.** SQLite is the default, matching the job posting. Authentication and tenancy remain outside this small task.

## Functional requirements

| Requirement | Implementation and evidence |
|---|---|
| Booking CRUD, fields and validation | Laravel resource routes, Form Requests, resources, API feature tests |
| Overlap rejection and cancellation | Transactional service, half-open intervals, cancelled bookings excluded; API tests |
| Simultaneous bookings | SQLite `BEGIN IMMEDIATE`, 5000ms busy timeout; three independent-process HTTP race tests |
| List, status filtering, pagination | Server Component fetches Laravel; status/page come from the URL; browser tests |
| Details and missing records | Server fetch and `notFound()`; API and browser tests |
| Create/edit and inline errors | Server Actions map Laravel 422 field errors to action state; unit and browser tests |
| Updates without full reload | Revalidate list/detail/edit paths and redirect; browser test revisits a previously viewed filtered list and checks that the document survives |
| Loading/error/empty states | Route loading skeletons and error boundaries; list empty state and missing-record pages |
| Melbourne timezone and DST | UTC API/storage; Melbourne forms/display; skipped/repeated local times rejected; unit and browser tests |

## Verification

| Check | Result |
|---|---|
| `cd api && composer validate --strict` | Passed; installed Composer emits a dependency deprecation notice |
| `cd api && vendor/bin/pest --compact` | **35 passed, 122 assertions**, including all three SQLite races |
| `cd api && vendor/bin/pint --test` | Passed |
| `cd web && bun run test` | **26 passed, 51 assertions** |
| `cd web && bun run lint` | Passed |
| `cd web && bun run typecheck` | Passed |
| `cd web && bun run build` | Passed; list/detail/edit are dynamic routes |
| Desktop/mobile Playwright suite | **20 passed** using local Chrome |
| SQLite setup smoke test | Passed in an isolated application copy using existing installed dependencies: `.env.example`, key generation, fresh SQLite file, migration/seeding, HTTP 200 and 24 bookings |
| Public repository | Confirmed public at `https://github.com/maktezi/caravan-workshop-booking`; local changes still need publishing |

The race tests live in `api/tests/Feature/SQLiteConcurrencyTest.php` and run with the default Pest suite. Two workers connect to one temporary SQLite file and enter transactions while a parent holds the database writer. After release, exactly one request succeeds and the other returns HTTP 422 with a `service_bay` error. Scenarios cover create/create, create/reactivation, and reactivation/reactivation. Every scenario verifies only one active booking remains, and removes its temporary database afterward.

The old MySQL-only concurrency test remains optional and was not rerun. SQLite runtime checks supersede the previous sandbox-blocked verification entries. A complete dependency install from a clean clone and a separate manual visual review were not performed in this update.

## Engineering choices

- SQLite uses immediate transactions so availability checks run after acquiring the database writer; all booking mutations remain in `BookingService`. MySQL compatibility retains destination-bay row locks and deadlock retries.
- Reads use server-only helpers with `cache: "no-store"`; React memoization deduplicates detail reads within a render.
- Successful Server Actions revalidate list/detail/edit routes before redirecting. Failed submissions preserve values and display Laravel field errors.
- Cancellation preserves history and releases the bay. Deletion is permanent. Both require confirmation.
- Fresh setup uses SQLite without a database server. Generated SQLite files are ignored by Git.
- README explains caching, simultaneous requests, changes for 200 dealers, and AI assistance/corrections.

## Remaining external work

- [ ] Record a Loom walkthrough under five minutes with screen and voice, transcript enabled, and anyone-with-link sharing.
- [ ] Publish the completed local changes to the public repository.
- [ ] Supply the CV, production project link and ownership description.
- [ ] Confirm individual-applicant status and availability for 40 hours/week, Monday–Friday, 7am–4pm PHT.
- [ ] Submit via OnlineJobs with favourite coding language + favourite AI model as the subject.

These personal and external deliverables cannot be established by the application code.
