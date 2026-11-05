# Repository Guidelines

## Project Structure & Module Organization

- `api/` contains Laravel 13. Controllers, Form Requests, API Resources, models, and booking logic live under `app/`; migrations and seeders live under `database/`.
- `api/routes/api.php` defines REST endpoints. `api/tests/Feature/` covers API behavior; `api/tests/Concurrency/` contains the separate MySQL race test.
- `web/` contains Next.js App Router and strict TypeScript. Routes and global styles live in `app/`; static assets belong in `public/`.
- `docs/prd.md` defines booking rules and acceptance criteria. Document intentional scope changes, particularly authentication and tenancy.

## Build, Test, and Development Commands

Run commands from the relevant application directory:

- Backend: `composer install`, then configure `.env`, run `php artisan key:generate`, and `php artisan migrate --seed`.
- `composer dev`: serve Laravel at port 8000.
- `composer test`: run Pest's default API suite.
- `composer lint`: check PHP formatting with Laravel Pint.
- Frontend: `bun install --frozen-lockfile`, then `bun run dev` to serve Next.js at port 3000.
- `bun run lint`: run ESLint with Next.js and TypeScript rules.
- `bun run build` and `bun run start`: build and serve the production frontend.

## Coding Style & Naming Conventions

Use four-space indentation in PHP and two spaces in TypeScript/TSX. Format PHP with Pint. Use PascalCase PHP classes, explicit parameter and return types, and camelCase methods. Preserve Next.js route filenames such as `page.tsx` and `layout.tsx`. Keep HTTP handling in controllers, validation in Form Requests, and transactional booking rules in `BookingService`.

## Testing Guidelines

Name PHP tests `*Test.php` and use descriptive Pest scenarios. Cover overlap rejection, adjacent appointments, cancellation, partial updates, filtering, and pagination. No numerical coverage threshold is configured. The default suite includes independent-process SQLite concurrency tests. Optional MySQL compatibility can be checked separately with `DB_DATABASE=caravan_workshop_test vendor/bin/pest --configuration=phpunit.mysql.xml`. This command recreates the dedicated test database.

## Commit & Pull Request Guidelines

No Git history is available yet. Use concise imperative commits such as `Add booking conflict validation`. PRs should describe behavior, reference relevant PRD requirements, list checks and limitations, and include screenshots for UI changes.

## Configuration & Data Integrity

Never commit `.env`, secrets, or generated dependencies. Keep `.env.example` current. Store booking times in UTC and display Melbourne time. Route all booking mutations through the service's transaction and locking logic.
