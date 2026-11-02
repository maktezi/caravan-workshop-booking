# Caravan Workshop frontend

Next.js App Router with React Server Components, Server Actions, TypeScript, CSS and Tailwind CSS. The booking form uses shadcn/ui Select, Calendar and Popover components; Laravel remains the source of booking validation rules. See the [root README](../README.md) for Laravel/MySQL setup and the [implementation tracker](../docs/implementation.md) for coverage and verification status.

```sh
bun install --frozen-lockfile
cp .env.example .env.local
bun run dev
```

Set `API_BASE_URL` in `.env.local` to the Laravel API base, normally `http://127.0.0.1:8000/api`. It remains on the server. The application starts at `http://localhost:3000/bookings`.

- `app/bookings/`: server-rendered list, detail, new/edit routes and route states.
- `app/actions/bookings.ts`: API mutations, error mapping, revalidation and redirects.
- `components/bookings/`: forms, status badges, pagination and confirmation dialogs.
- `components/ui/`: locally owned shadcn/ui components, styled to match the workshop interface.
- `lib/`: server-only API helpers and Melbourne timezone conversion.
- `types/booking.ts`: API and form contracts.
- `tests/unit/`: Bun tests for Server Actions and daylight-saving boundaries.
- `tests/e2e/`: Playwright desktop/mobile workflows with an isolated SQLite API fixture.

Checks: `bun run test`, `bun run lint`, `bun run typecheck`, `bun run build`. Use `bun run start` after building. For browser tests, install Chromium with `bunx playwright install chromium`, then run `bun run test:e2e`. The fixture recreates only its dedicated `api/storage/framework/testing/browser-e2e.sqlite` file. MySQL race verification is a separate backend test.
