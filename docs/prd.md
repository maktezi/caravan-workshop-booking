# Product Requirements Document (PRD)
## Caravan Workshop Booking Management System

**Version:** 1.0  
**Status:** Ready for Development  
**Project Type:** Full-Stack Technical Assessment  
**Scope correction (3 November 2026):** The application posting requires SQLite without a database server. This supersedes the original MySQL setup; optional MySQL compatibility remains. Authentication and tenancy remain outside the task.

**Technology:** Laravel 13, Next.js 15+, TypeScript, SQLite, Pest
**Submission Deadline:** November 4, 2026 — 11:59 PM PHT  
**Estimated Development Effort:** Approximately 3 hours

---

## 1. Product Overview

### 1.1 Purpose

Develop a lightweight workshop booking management module for a caravan dealership.

The system allows dealership staff to create, view, update, and cancel service appointments for customer caravans across four service bays.

The primary objective is to provide reliable booking management while preventing conflicting reservations, including when multiple users attempt to reserve the same service bay simultaneously.

### 1.2 Problem Statement

A caravan workshop has a limited number of service bays. Each bay can accommodate only one active service booking during a given time period.

Without proper booking management, staff may accidentally assign overlapping appointments to the same service bay, resulting in scheduling conflicts and operational delays.

### 1.3 Product Goals

- Provide straightforward booking CRUD operations.
- Prevent overlapping active bookings within the same service bay.
- Ensure concurrent booking attempts cannot create scheduling conflicts.
- Provide server-rendered booking lists with pagination and filtering.
- Display meaningful validation feedback.
- Keep the implementation maintainable, testable, and appropriately scoped.

### 1.4 Target Users

**Primary user:** Caravan dealership service staff or workshop administrator.

**Assumptions:**
- The application is an internal demonstration module.
- Authentication and authorization are not required.
- Customers do not directly access the application.
- Service bays are predefined and cannot be managed through the UI.

---

## 2. Scope

### 2.1 In Scope

**Backend**
- Laravel REST API
- SQLite database
- Booking CRUD operations
- Form Request validation
- Concurrency-safe overlap prevention
- Sample data seeder
- Automated Pest tests

**Frontend**
- Next.js App Router
- TypeScript
- Server-rendered booking list and detail pages
- URL-based pagination and status filtering
- Booking creation and editing using Server Actions
- Field-level validation messages
- Loading, empty, not-found, and error states
- Cache invalidation after mutations

**Documentation**
- Root README
- Environment configuration examples
- Senior technical decision write-up
- AI usage disclosure
- Recorded Loom walkthrough

### 2.2 Out of Scope

- User authentication and role management
- Customer registration or accounts
- Payments or invoicing
- Email or SMS notifications
- Service bay administration
- Calendar drag-and-drop
- Workshop staff scheduling
- Multi-tenant implementation
- Deployment and CI/CD
- Real-time synchronization through WebSockets

---

## 3. Functional Requirements

### FR-01: Booking Management

The system must support the following operations:

| Operation | Description |
|---|---|
| Create | Create a workshop service booking |
| Read | View an individual booking |
| List | Display bookings with pagination and filtering |
| Update | Modify existing booking details |
| Delete | Permanently remove a booking |
| Cancel | Change a booking's status to `cancelled` |

Deleting and cancelling are separate actions.

Cancellation preserves the booking record for reference. Deletion removes it from the database.

### FR-02: Booking Data Fields

| Field | Type | Required | Validation |
|---|---|---|---|
| id | BIGINT | Auto | Primary key |
| customer_name | VARCHAR(255) | Yes | Non-empty string |
| customer_email | VARCHAR(255) | Yes | Valid email |
| rego | VARCHAR(50) | Yes | Non-empty string |
| service_bay | VARCHAR(20) | Yes | Bay 1, Bay 2, Bay 3, Bay 4 |
| starts_at | DATETIME | Yes | Valid datetime |
| ends_at | DATETIME | Yes | Must be later than starts_at |
| status | ENUM-like string | Yes | pending, confirmed, cancelled |
| notes | TEXT | No | Nullable text |
| created_at | TIMESTAMP | Auto | Record creation |
| updated_at | TIMESTAMP | Auto | Last modification |

Database indexes should support filtering bookings by service bay, status, and time.

Store appointment timestamps in UTC.

### FR-03: Booking Status

Supported booking statuses:

**Pending**
- Booking is awaiting confirmation.
- Reserves the selected service bay.

**Confirmed**
- Booking has been confirmed.
- Reserves the selected service bay.

**Cancelled**
- Booking is no longer active.
- Does not reserve the service bay.

Allowed status changes are unrestricted within the three defined values for this assessment. Every update must still satisfy all applicable booking rules.

### FR-04: Booking Conflict Prevention

The system must prevent two active bookings from overlapping within the same service bay.

An overlap exists when:

`existing.starts_at < requested.ends_at`

AND

`existing.ends_at > requested.starts_at`

Additional conditions:
- The bookings use the same service bay.
- The existing booking status is not cancelled.
- The requested booking status is not cancelled.
- When updating a booking, exclude the booking's own ID from conflict detection.

**Example scenarios:**

| Existing booking | New booking | Expected |
|---|---|---|
| Bay 1, 09:00–10:00 | Bay 1, 09:30–10:30 | Reject |
| Bay 1, 09:00–10:00 | Bay 1, 10:00–11:00 | Allow |
| Bay 1, 09:00–10:00 | Bay 2, 09:30–10:30 | Allow |
| Cancelled, Bay 1, 09:00–10:00 | Bay 1, 09:30–10:30 | Allow |
| Pending, Bay 1, 09:00–10:00 | Bay 1, 09:30–10:30 | Reject |
| Confirmed, Bay 1, 09:00–10:00 | Bay 1, 09:30–10:30 | Reject |

**Critical requirement: concurrency safety**

Checking for conflicts before inserting the booking is not sufficient.

The implementation must serialize conflicting operations using a database transaction and a shared locking mechanism.

Recommended approach:
1. Begin a transaction with `BEGIN IMMEDIATE` (Laravel connection transaction mode `IMMEDIATE`, busy timeout 5000ms).
2. SQLite reserves its single writer before any availability reads.
3. Query for overlapping active bookings.
4. Reject the operation if a conflict exists.
5. Otherwise, create or update the booking.
6. Commit the transaction.

The four fixed service bays are represented by seeded database rows. SQLite serializes database writers; optional MySQL deployments can lock these stable bay rows instead.

All booking writes must follow this process, including status updates and changing service bays. This prevents two concurrent requests from both observing an empty slot and creating conflicting bookings.

Use the same write transaction for rescheduling, cancellation and deletion. SQLite does not support row-level `SELECT ... FOR UPDATE` locks.

### FR-05: Booking Listing

Route: `/bookings`

Requirements:
- Display bookings in a table or simple list.
- Show 10 records per page.
- Support status filtering.
- Store pagination and filters in URL search parameters.
- Fetch data through a Next.js Server Component.
- Display an empty state when no records match.

Example routes:

`/bookings`

`/bookings?status=confirmed`

`/bookings?status=pending&page=2`

`/bookings?status=cancelled&page=1`

The booking list should display:
- Customer name
- Caravan registration
- Service bay
- Start time
- End time
- Status
- View or edit action

Bookings should be ordered deterministically by start time, followed by ID to resolve ties.

### FR-06: Booking Details

Route: `/bookings/[id]`

The detail page must show all booking fields.

If a booking does not exist, the application must display a proper 404 state using the Next.js App Router's not-found handling.

### FR-07: Create Booking

Route: `/bookings/new`

Provide a form containing all required booking fields.

Requirements:
- Submit through a Next.js Server Action.
- Send data to the Laravel API.
- Display Laravel validation errors under the associated fields.
- Preserve submitted values after validation failure.
- Display a clear overlap-conflict error.
- Navigate to a suitable page after successful creation.

Default status: `pending`.

### FR-08: Edit Booking

Route: `/bookings/[id]/edit`

Requirements:
- Prepopulate all fields from the API.
- Use a Server Action for submission.
- Support modifying date, time, service bay, status, and customer details.
- Enforce overlap validation when relevant fields change.
- Show field-level errors.
- Refresh affected booking views following successful updates.

### FR-09: Delete and Cancel Booking

Users must be able to delete or cancel an existing booking.

Requirements:
- Cancellation changes the status to `cancelled`.
- Deletion uses the Laravel delete endpoint.
- Destructive actions should require a confirmation interaction.
- Successful changes invalidate stale booking data.

### FR-10: Timezone Management

All booking timestamps must be stored in UTC.

The frontend must display times using the `Australia/Melbourne` timezone.

Requirements:
- Convert user-entered Melbourne local times to UTC before sending them to the API.
- Convert returned UTC timestamps to Melbourne local time for display.
- Respect daylight saving time automatically.
- Handle invalid or ambiguous daylight-saving transition times rather than silently choosing an unintended instant.
- Use ISO 8601 timestamps with an explicit offset or `Z` when communicating with the API.

---

## 4. Backend Requirements

### 4.1 Technology

- PHP and Laravel 13
- SQLite
- Laravel Eloquent ORM
- Laravel Form Requests
- Laravel API Resources
- Pest testing framework

### 4.2 REST API Endpoints

Base path: `/api`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/bookings` | Paginated booking list |
| GET | `/api/bookings/{id}` | Booking details |
| POST | `/api/bookings` | Create booking |
| PUT/PATCH | `/api/bookings/{id}` | Update booking |
| DELETE | `/api/bookings/{id}` | Delete booking |

List query parameters:

- `page`: positive integer, default 1
- `status`: optional, one of pending, confirmed, cancelled

Laravel's standard paginated JSON response may be used, including `data`, `links`, and `meta`.

### 4.3 API Response Conventions

**Successful create:** HTTP 201

**Successful read/update:** HTTP 200

**Successful delete:** HTTP 204

**Validation failure:** HTTP 422

**Booking not found:** HTTP 404

**Unexpected server error:** HTTP 500

The frontend must correctly handle these responses.

Example validation response:

```json
{
  "message": "The selected service bay is unavailable for this time range.",
  "errors": {
    "service_bay": [
      "This bay already has a booking during the selected time."
    ]
  }
}
```

Date validation errors should be associated with `starts_at` or `ends_at`, as appropriate.

### 4.4 Recommended Backend Architecture

```text
api/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Api/
│   │   │       └── BookingController.php
│   │   ├── Requests/
│   │   │   ├── StoreBookingRequest.php
│   │   │   └── UpdateBookingRequest.php
│   │   └── Resources/
│   │       └── BookingResource.php
│   ├── Models/
│   │   ├── Booking.php
│   │   └── ServiceBay.php
│   └── Services/
│       └── BookingService.php
├── database/
│   ├── migrations/
│   └── seeders/
├── routes/
│   └── api.php
└── tests/
    └── Feature/
        └── BookingTest.php
```

**Separation of responsibilities:**
- Form Requests: Input validation
- Controller: HTTP request and response handling
- BookingService: Booking operations, transactions, overlap prevention
- Models: Database relationships and persistence
- API Resources: Consistent serialization
- Feature Tests: Observable API behavior

Keep the implementation small; avoid unnecessary repositories, interfaces, and abstraction layers.

---

## 5. Frontend Requirements

### 5.1 Technology

- Next.js 15 or newer
- App Router
- TypeScript
- React Server Components
- Server Actions
- Basic CSS or Tailwind CSS

### 5.2 Component Responsibilities

**Server Components**
- Booking list page
- Booking detail page
- Initial booking data retrieval
- Initial edit form data retrieval
- Pagination data handling

**Client Components**
- Interactive form fields
- Validation-error presentation
- Submit and pending states
- Status filter controls, if interactive
- Confirmation dialogs

**Server Actions**
- Create booking
- Update booking
- Delete booking
- Cancel booking
- Revalidate affected pages

Server Actions must call Laravel HTTP endpoints rather than access SQLite.

### 5.3 Recommended Frontend Architecture

```text
web/
├── app/
│   ├── bookings/
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   ├── new/
│   │   │   └── page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       ├── not-found.tsx
│   │       └── edit/
│   │           └── page.tsx
│   ├── actions/
│   │   └── bookings.ts
│   └── layout.tsx
├── components/
│   └── bookings/
│       ├── booking-form.tsx
│       ├── booking-list.tsx
│       ├── status-filter.tsx
│       └── pagination.tsx
├── lib/
│   ├── api.ts
│   ├── bookings.ts
│   └── timezone.ts
└── types/
    └── booking.ts
```

### 5.4 Data Fetching and Cache Strategy

Initial pages should retrieve data on the server through the Laravel API.

Recommended strategy:
- Use uncached or explicitly `no-store` fetching for booking reads.
- Use Server Actions for mutations.
- Use `revalidatePath` for affected routes when relevant.
- Use `redirect` or `router.refresh()` as appropriate after successful changes.
- Do not perform a full browser reload.

Because bookings represent operational scheduling data, correctness and freshness are more important than aggressive caching.

A simple uncached approach is acceptable for this assessment if the README explains the decision.

### 5.5 Required UI States

- Loading: Route-level loading indicator or skeleton
- Empty: No bookings match the selected criteria
- Validation error: Field-specific feedback
- Conflict: Service bay unavailable message
- Not found: Booking does not exist
- Network/server error: Recoverable error state
- Submitting: Disable duplicate form submission while pending
- Success: Updated list or detail reflects saved information

---

## 6. Database Design

### Bookings Table

```text
bookings
--------
id                 BIGINT PRIMARY KEY
customer_name      VARCHAR(255)
customer_email     VARCHAR(255)
rego               VARCHAR(50)
service_bay         VARCHAR(20)
starts_at          DATETIME
ends_at            DATETIME
status             VARCHAR(20)
notes              TEXT NULL
created_at         TIMESTAMP
updated_at         TIMESTAMP
```

### Service Bays Table

```text
service_bays
------------
id                 BIGINT PRIMARY KEY
name               VARCHAR(20) UNIQUE
```

Seeded data:

- Bay 1
- Bay 2
- Bay 3
- Bay 4

The `service_bays` table constrains valid bays and can support row locking on a future server database. No management UI or CRUD endpoints for service bays are required.

---

## 7. Testing Requirements

Use Pest to verify critical business behavior.

| Test ID | Scenario | Expected Result |
|---|---|---|
| T01 | Create valid booking | 201, stored in database |
| T02 | Missing customer name | 422 validation error |
| T03 | Invalid email | 422 validation error |
| T04 | End time before start time | 422 validation error |
| T05 | End time equals start time | 422 validation error |
| T06 | Invalid service bay | 422 validation error |
| T07 | Invalid status | 422 validation error |
| T08 | Overlapping booking in same bay | 422 validation error |
| T09 | Adjacent bookings in same bay | Both allowed |
| T10 | Same time in different bays | Both allowed |
| T11 | Overlap with cancelled booking | Allowed |
| T12 | Pending booking overlaps confirmed booking | Rejected |
| T13 | Update booking to occupied slot | Rejected |
| T14 | Update without conflicting with itself | Allowed |
| T15 | Change cancelled booking to confirmed in occupied slot | Rejected |
| T16 | Filter bookings by status | Correct records |
| T17 | Paginate bookings | Maximum 10 per page |
| T18 | Request nonexistent booking | 404 |
| T19 | Delete booking | Record removed |
| T20 | Concurrent competing creates | At most one active booking succeeds |

**Concurrency test requirement:** Use two genuinely independent database connections or processes with a controlled overlapping execution window. A purely sequential test does not demonstrate that the race condition is prevented. The concurrent test must run against SQLite, using the same transactional locking behavior as production.

---

## 8. Non-Functional Requirements

### 8.1 Reliability

- Prevent conflicting active bookings.
- Ensure booking writes are atomic.
- Return predictable error responses.

### 8.2 Maintainability

- Clear separation of backend and frontend concerns.
- Strict TypeScript types for API data.
- Consistent validation and error-handling patterns.
- Avoid unnecessary complexity.

### 8.3 Performance

- Limit booking list responses to 10 records.
- Use appropriate database indexes.
- Avoid redundant API requests.
- Prefer simple request/response communication over real-time infrastructure.

### 8.4 Usability

- Clear field labels and validation messages.
- Readable Melbourne-local dates and times.
- Accessible forms and buttons.
- Basic responsive presentation.

### 8.5 Data Integrity

- Database persists all bookings in SQLite.
- All timestamp comparisons use normalized UTC values.
- Booking conflicts must be checked within the database transaction.
- Cancelled bookings do not block availability.

---

## 9. Project Structure

The project must use a single Git repository.

```text
caravan-workshop-bookings/
├── api/
│   └── Laravel application
├── web/
│   └── Next.js application
├── README.md
└── .gitignore
```

Each application should contain an `.env.example` with required configuration settings.

Docker Compose is optional.

Next.js must communicate with Laravel exclusively over its HTTP API.

---

## 10. Development Priorities

The assessment should prioritize correctness over styling.

### Priority 1 — Core Backend
- Database migration and seeder
- Booking CRUD endpoints
- Form Request validation
- Transactional conflict prevention

### Priority 2 — Core Frontend
- Booking list and details
- URL-based pagination and filtering
- Create and edit forms
- Server Actions and error mapping

### Priority 3 — Verification
- Pest tests
- Concurrency verification
- Loading and error handling
- Local end-to-end smoke test

### Priority 4 — Submission
- README documentation
- AI usage disclosure
- Loom walkthrough
- Public GitHub repository

**Time-management guideline:** Do not add unrequested features. If the project exceeds the intended effort, prioritize conflict prevention, functional CRUD, frontend data flow, and meaningful tests before visual polish.

---

## 11. Acceptance Criteria

The assessment is functionally complete when:

- [ ] The repository contains `/api` and `/web`.
- [ ] Laravel 13 runs locally with SQLite.
- [ ] Next.js 15+ runs locally.
- [ ] The API supports booking CRUD.
- [ ] Form Requests validate inputs correctly.
- [ ] Overlapping active bookings in the same bay are rejected.
- [ ] Simultaneous attempts cannot create conflicting bookings.
- [ ] Cancelled bookings do not reserve bays.
- [ ] Pest tests cover critical booking behavior.
- [ ] Sample bookings can be seeded.
- [ ] `/bookings` supports server-side data fetching.
- [ ] Pagination works with 10 records per page.
- [ ] Status filtering works through URL parameters.
- [ ] `/bookings/[id]` returns a proper not-found state.
- [ ] Create and edit forms use Server Actions.
- [ ] Laravel validation errors appear next to relevant inputs.
- [ ] Booking views update after changes without a full page reload.
- [ ] Loading and error states are implemented.
- [ ] Times are stored in UTC and displayed in Melbourne time.
- [ ] The root README explains setup and engineering decisions.
- [ ] AI tool usage and one corrected AI mistake are documented.
- [ ] A Loom walkthrough of 5 minutes or less is available.
- [ ] The public GitHub repository and Loom links are submitted before the deadline.

---

## 12. README Requirements

The root README must contain:

### Local Setup
- Prerequisites
- SQLite configuration
- Backend installation and migration commands
- Database seeding instructions
- Backend testing instructions
- Frontend installation and startup commands
- Local URLs and environment variables

### Senior Engineering Write-Up

Maximum half a page, covering:

1. **Caching and revalidation:** Explain server-side data freshness and UI updates after mutations.
2. **Concurrency:** Explain transactional bay locking and why a basic overlap query is insufficient.
3. **Scaling to 200 dealers:** Explain tenant isolation, dealer-scoped service bays, database indexes, authorization, and tenant-scoped concurrency locks.

### AI Disclosure
- Which AI tools were used.
- How they assisted development.
- One specific AI-generated mistake that was identified and corrected.

### Assumptions
Document implementation choices that were not explicitly specified.

---

## 13. Loom Walkthrough Requirements

Maximum duration: 5 minutes.

Include the developer's screen and voice.

Suggested structure:

| Segment | Duration | Content |
|---|---|---|
| Introduction | 30 seconds | Product overview and architecture |
| Code structure | 60 seconds | Laravel and Next.js responsibilities |
| Server vs client | 60 seconds | Server Components, Client Components, Server Actions |
| Validation flow | 60 seconds | Laravel validation through API to form field |
| Engineering decisions | 60 seconds | Most confident and least confident decisions |
| Closing | 30 seconds | Tests and final observations |

Loom settings:
- Anyone with the link can view.
- Transcript enabled.

---

## 14. Assumptions and Design Decisions

The following assumptions should be verified during implementation and documented in the README:

1. Service bays are fixed to Bay 1–4.
2. Status defaults to `pending` during creation.
3. Both pending and confirmed bookings reserve their bays.
4. Cancelled bookings remain stored but do not block scheduling.
5. Back-to-back bookings are allowed.
6. Booking times represent Melbourne-local business appointments, converted to UTC for storage.
7. The application is intended for internal workshop staff.
8. No login, authorization, payments, or notifications are needed.
9. Deletion is permanent, while cancellation retains booking history.
10. Booking list sorting is deterministic and based on start time, with ID as a tie-breaker.
11. SQLite uses immediate write transactions; service bay rows can serve as stable locks on a future MySQL deployment.
12. Form validation and booking conflict errors use HTTP 422 with field-specific errors.

---

## 15. Definition of Done

The implementation is ready for submission when:

- The application starts successfully using the README.
- Core booking workflows function locally.
- Concurrent booking conflicts are prevented at the database level.
- Automated tests for important rules pass.
- Frontend validation feedback and navigation work as required.
- The repository contains no secrets or credentials.
- The README includes all requested technical explanations.
- The Loom video is accessible with its transcript enabled.
- Both submission links are ready before the deadline.

**Final deliverable:** One public GitHub repository containing the Laravel API, Next.js frontend, database configuration, tests, seeder, and documentation, accompanied by one Loom walkthrough video.
