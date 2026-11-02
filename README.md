# Caravan Workshop Booking

Laravel 13 REST API in `api/` and a Next.js App Router application in `web/`. Product requirements live in `docs/prd.md`.

## Current implementation

The API supports booking CRUD, cancellation through a status update, validation, pagination, status filtering, UTC timestamps, and transactional service-bay locking. The Next.js application is currently its initial scaffold; booking pages and Server Actions are still to be implemented. Authentication and tenancy are pending a scope decision because the PRD excludes both.

The backend was bootstrapped from Billo's locally installed Laravel 13.33 dependencies because Packagist was unavailable. Its dependency closure is recorded in `api/composer.lock` and validated by Composer. Billo's production environment, credentials, business data, billing, GraphQL, and inventory modules were not copied. Its booking availability approach informed the overlap predicate; workshop bookings use their own model and stable bay locks.

## Local setup

Prerequisites: PHP 8.5+, Composer, MySQL with InnoDB, and Node.js compatible with the installed Next.js release.

Create a MySQL database named `caravan_workshop`, then:

```sh
cd api
composer install
cp .env.example .env
# Configure DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME and DB_PASSWORD.
php artisan key:generate
php artisan migrate --seed
php artisan serve --host=127.0.0.1 --port=8000
```

The four bay rows are inserted by the migration, so they exist even without seeding. The seeder adds 24 sample appointments to an empty booking table and preserves existing bookings.

In another terminal:

```sh
cd web
bun install --frozen-lockfile
cp .env.example .env.local
bun run dev
```

API health: `http://127.0.0.1:8000/api/health`. Next.js: `http://localhost:3000`. `API_BASE_URL` is a server-only setting intended for future Server Components and Server Actions.

## API

- `GET /api/bookings?status=confirmed&page=1`: ten records per page, ordered by start time and ID.
- `POST /api/bookings`: create; returns 201.
- `GET /api/bookings/{id}`: detail.
- `PUT` or `PATCH /api/bookings/{id}`: update, including partial updates.
- `PATCH /api/bookings/{id}` with `{"status":"cancelled"}`: cancel and retain history.
- `DELETE /api/bookings/{id}`: permanently delete; returns 204.

Required create fields: `customer_name`, `customer_email`, `rego`, `service_bay`, `starts_at`, `ends_at`. Status defaults to `pending`; `notes` is optional. Bays are `Bay 1` through `Bay 4`; statuses are `pending`, `confirmed`, and `cancelled`. Send timestamps such as `2026-11-03T09:00:00+11:00` or `2026-11-02T22:00:00Z`. Returned timestamps are UTC. Validation and conflicts return 422 with field-specific `errors`; missing records return 404.

## Verification

```sh
cd api
composer validate --strict
composer test
composer lint
```

The default Pest suite uses in-memory SQLite for API behavior. SQLite cannot verify MySQL row locking. Create a separate, disposable MySQL database named `caravan_workshop_test`, configure its connection, and run:

```sh
DB_DATABASE=caravan_workshop_test vendor/bin/pest --configuration=phpunit.mysql.xml
```

This command **recreates all tables in the test database**. It refuses databases whose names do not end in `_test`. Two independent PHP processes contend for a bay initially locked by the parent connection; after release, exactly one create must succeed. MySQL execution has not been verified in this environment because the local server connection was unavailable.

Frontend checks: `cd web && bun run lint` and `bun run build`.

## Engineering decisions

All booking writes use transactions. Create and update lock the destination bay's permanent row before checking availability; updates also lock and reload the booking before merging partial changes. Conflict checks use a locking read to avoid stale MySQL repeatable-read snapshots. Deadlocks are retried. Cancellation and deletion also acquire bay locks. Pending and confirmed bookings reserve bays; cancelled bookings do not. Half-open intervals permit adjacent appointments.

The frontend will read through Laravel HTTP endpoints, use uncached server fetches, and revalidate affected pages after Server Actions. Melbourne display, daylight-saving ambiguity handling, and UI error states remain frontend work.

Scaling to 200 dealers would require explicit authorization and tenant isolation, dealer-scoped bay lock rows and indexes, and tenant context on every request. Billo's PostgreSQL schema tenancy cannot be copied directly into this MySQL assessment without adapting provisioning and connection management.

## AI disclosure

OpenAI Codex assisted repository inspection, extracting the Laravel dependency subset, implementing API validation and locking, and writing tests. A generated bootstrap initially omitted Laravel's middleware configuration, causing API dispatch to fail; the failing health test exposed the issue and the bootstrap was corrected. The frontend implementation and recorded walkthrough remain outstanding.
