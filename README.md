# Caravan Workshop Booking

Workshop appointments across four fixed service bays, implemented with Laravel 13 and Next.js App Router. [Product requirements](docs/prd.md) · [Implementation tracker](docs/implementation.md).

The application supports booking CRUD, cancellation, conflict prevention, server-rendered lists and details, URL pagination/filtering, field validation, confirmation dialogs, and Melbourne-local times. Authentication and multi-tenancy are excluded as specified by the PRD.

## Local setup

Prerequisites: PHP 8.5+ with PDO SQLite, Composer, Bun, and Node.js 20.9+ (or a newer supported LTS).

No database server is needed:

```sh
cd api
composer install
cp .env.example .env
touch database/database.sqlite
# Keep DB_CONNECTION=sqlite; DB_DATABASE can remain unset.
php artisan key:generate
php artisan migrate --seed
composer dev
```

The migration creates Bay 1–4 as fixed service bays. The seeder adds 24 sample appointments only when the bookings table is empty.

In another terminal:

```sh
cd web
bun install --frozen-lockfile
cp .env.example .env.local
bun run dev
```

Open **http://localhost:3000/bookings**. The API runs at **http://127.0.0.1:8000/api**; health is `/api/health`. `web/.env.local` sets `API_BASE_URL`, a server-only variable. Browser mutations call Next.js Server Actions; those actions call Laravel. Browser CORS configuration is therefore unnecessary for this flow.

The API always stores and returns UTC. Forms and detail/list pages use `Australia/Melbourne` and label local times. Invalid spring-forward times and ambiguous fall-back times produce field errors; choose a time outside the transition hour. Back-to-back bookings are allowed. Cancellation releases the bay and retains history; deletion permanently removes the record.

## API

| Method | Endpoint | Result |
|---|---|---|
| GET | `/api/bookings?status=confirmed&page=1` | Ten records per page, ordered by start time then ID |
| POST | `/api/bookings` | Create, HTTP 201 |
| GET | `/api/bookings/{id}` | Detail, HTTP 200 |
| PUT/PATCH | `/api/bookings/{id}` | Update, HTTP 200; partial fields accepted |
| PATCH | `/api/bookings/{id}` with `{"status":"cancelled"}` | Cancel and preserve history |
| DELETE | `/api/bookings/{id}` | Permanently delete, HTTP 204 |

Create fields: `customer_name`, `customer_email`, `rego`, `service_bay`, `starts_at`, `ends_at`, optional `status` and `notes`. Status defaults to `pending`; allowed statuses are `pending`, `confirmed`, and `cancelled`. Bay values are `Bay 1` through `Bay 4`. Send ISO timestamps with an offset or `Z`, for example `2026-11-03T09:00:00+11:00`. Validation/conflicts return HTTP 422 with field-specific `errors`; missing records return 404.

## Checks

```sh
cd api
composer validate --strict
composer test
composer lint
```

The default Pest suite covers API behavior using SQLite in memory and concurrency using a temporary SQLite file. Three race scenarios (create/create, create/update, update/update) run two independent PHP processes through the HTTP kernel. A parent-held write transaction forces both requests to contend; exactly one succeeds and the other returns HTTP 422 with a `service_bay` error. Temporary databases are removed afterward.

The existing MySQL race test remains optional for a future MySQL deployment; it is not needed to run this task.

```sh
cd web
bun run test
bun run lint
bun run typecheck
bun run build
# For a production server after building:
bun run start
```

The production build uses Webpack to avoid Turbopack's auxiliary loader ports in restricted environments. Styling uses CSS, Tailwind CSS and locally owned shadcn/ui components, with local font fallbacks; no font download is required. The select and date picker controls submit through the existing Server Action and Laravel validation flow.

Browser tests start isolated Laravel and Next.js servers on ports **18000** and **13000** and reset only `api/storage/framework/testing/browser-e2e.sqlite`. They do not use the application database:

```sh
cd web
bunx playwright install chromium
bun run test:e2e
# Or use an existing Chrome installation:
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' bun run test:e2e
```

The desktop/mobile cases cover CRUD, confirmations, retained validation values, conflicts, filtering, pagination, DST errors, empty pages, and missing records. See the [tracker](docs/implementation.md) for observed results. Verified: 35 backend tests (including three SQLite races), 26 frontend unit tests, and all 20 desktop/mobile browser cases pass. PHP formatting, frontend lint/type checks, and the production build also pass.

## Engineering decisions

**Freshness:** Server Components fetch Laravel with `cache: "no-store"`. React request memoization avoids repeated detail reads within a render without sharing cached bookings across requests. Server Actions revalidate the list, affected detail, and edit routes before redirecting. Field errors return action state, preserving local form values without a full reload.

**Concurrency:** SQLite transactions use `BEGIN IMMEDIATE`, reserving the single database writer before reading availability. A competing request waits for the writer (up to five seconds), then checks availability after the first commits; the loser receives Laravel's normal field-specific conflict error. Every create, update, cancellation and deletion uses `BookingService` transactions. SQLite serializes all writers, which is appropriate for this small module. Cancelled bookings do not block a bay, and half-open intervals permit adjacent appointments. MySQL support retains bay-row locks and transaction retries.

**Scaling to 200 dealers:** First add authenticated dealer context and policies, scoping every read, write, availability check and queue job to that dealer, with isolation tests. Move to a server database such as MySQL, use dealer-scoped bay rows and indexes, and serialize competing writes with bay-row locks so unrelated dealers can write concurrently. Keep booking rules in the service and measure query performance before adding caches or queues.

## Assumptions and scope

This is an internal demonstration for dealership staff. Bays are fixed and cannot be administered. Past appointments are valid. Status transitions are unrestricted among the three allowed statuses, with conflict checks on each write. Workshop times use Melbourne's IANA timezone rules. Auth, tenancy, payments, notifications, calendar dragging, deployment and CI/CD are outside this implementation. External submission tasks remain listed in the tracker.

## AI disclosure

OpenAI Codex assisted implementation, repository review, and test development. The Impeccable skill informed interface accessibility and layout.

One corrected AI mistake: the initial design targeted MySQL despite the application requiring SQLite. It was corrected to use SQLite by default, acquire the write reservation before availability reads, and test simultaneous HTTP requests against a shared SQLite file. Another corrected mistake: the initial Laravel bootstrap omitted middleware configuration, causing API dispatch to fail. A failing health test exposed it; the bootstrap was corrected. Another review correction keys booking actions by status so a successful cancellation remounts and closes its confirmation dialog.

The developer must record the screen-and-voice Loom walkthrough, enable its transcript/public link, and submit the repository and Loom URLs. No video or submission is claimed to exist.
