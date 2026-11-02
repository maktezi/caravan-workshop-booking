# Caravan Workshop Booking

Workshop appointments across four fixed service bays, implemented with Laravel 13 and Next.js App Router. [Product requirements](docs/prd.md) · [Implementation tracker](docs/implementation.md).

The application supports booking CRUD, cancellation, conflict prevention, server-rendered lists and details, URL pagination/filtering, field validation, confirmation dialogs, and Melbourne-local times. Authentication and multi-tenancy are excluded as specified by the PRD.

## Local setup

Prerequisites: PHP 8.5+, Composer, MySQL with InnoDB, Bun, and Node.js 20.9+ (or a newer supported LTS).

Create a MySQL database named `caravan_workshop`, then:

```sh
cd api
composer install
cp .env.example .env
# Set DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME and DB_PASSWORD.
php artisan key:generate
php artisan migrate --seed
composer dev
```

The migration creates Bay 1–4 as permanent locking resources. The seeder adds 24 sample appointments only when the bookings table is empty.

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

The default Pest suite uses SQLite in memory. It covers API behavior but cannot prove MySQL locking. Create a **disposable** MySQL database named `caravan_workshop_test`, configure the test connection, then:

```sh
cd api
DB_DATABASE=caravan_workshop_test vendor/bin/pest --configuration=phpunit.mysql.xml
```

This test **recreates tables** and requires a database name ending in `_test`. Two independent PHP processes attempt competing bookings while a parent-held bay lock creates a controlled overlap window. After release, exactly one must create a booking and the other must report a conflict.

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

The ten desktop/mobile cases cover CRUD, confirmations, retained validation values, conflicts, filtering, pagination, DST errors, empty pages, and missing records. See the [tracker](docs/implementation.md) for observed results. MySQL concurrency and browser execution are currently blocked by the agent sandbox's socket/process restrictions; neither is claimed as passed.

## Engineering decisions

**Freshness:** Server Components fetch Laravel with `cache: "no-store"`. React request memoization avoids repeated detail reads within a render without sharing cached bookings across requests. Server Actions revalidate the list, affected detail, and edit routes before redirecting. Field errors return action state, preserving local form values without a full reload.

**Concurrency:** Every write uses a transaction and locks a permanent destination-bay row, including empty bays. Updates first reload and lock the booking so partial changes merge against current data. The overlap query uses a locking read to see newly committed bookings under MySQL repeatable-read isolation. Deadlocks retry up to five times. Cancelled bookings do not block a bay; half-open intervals permit adjacent appointments. MySQL connections use InnoDB and UTC.

**Scaling to 200 dealers:** Add authorization and tenant context to every request; isolate dealer data and use dealer-scoped bay rows, availability queries, indexes and locks. Dealer isolation must apply equally to reads, writes, queues and tests. A database-per-dealer strategy is possible, but Billo's PostgreSQL schema provisioning would need adapting to MySQL.

## Assumptions and scope

This is an internal demonstration for dealership staff. Bays are fixed and cannot be administered. Past appointments are valid. Status transitions are unrestricted among the three allowed statuses, with conflict checks on each write. Workshop times use Melbourne's IANA timezone rules. Auth, tenancy, payments, notifications, calendar dragging, deployment and CI/CD are outside this implementation. External submission tasks remain listed in the tracker.

## AI disclosure

OpenAI Codex assisted repository inspection, deriving the Laravel dependency subset from Billo's local Laravel 13.33 installation, implementing the API/frontend, and writing tests. No Billo credentials, business records, billing, GraphQL, inventory, or production environment were copied. The Impeccable skill informed interface accessibility and layout.

One corrected AI mistake: the initial Laravel bootstrap omitted middleware configuration, causing API dispatch to fail. A failing health test exposed it; the bootstrap was corrected. Another review correction keys booking actions by status so a successful cancellation remounts and closes its confirmation dialog.

The developer must record the screen-and-voice Loom walkthrough, enable its transcript/public link, and submit the repository and Loom URLs. No video or submission is claimed to exist.
