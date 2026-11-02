# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Caravan dealership service staff and workshop administrators scheduling customer caravans. This is an internal assessment module, as specified in `docs/prd.md`.

## Product Purpose

Create, inspect, update, cancel and delete service bookings across four fixed bays while preventing concurrent overlapping active reservations.

## Capabilities and Constraints

Laravel 13, MySQL and Pest in `api/`; Next.js App Router and strict TypeScript in `web/`. Pagination and filtering belong in the URL. Server Components fetch initial data; Server Actions call Laravel HTTP endpoints. Store UTC; display and enter Australia/Melbourne time. Reject invalid or ambiguous DST input. Auth, tenancy, billing and notifications are outside this PRD.

## Product Principles

- Scheduling correctness comes first.
- Preserve form values and provide field-specific recovery.
- Cancellation preserves history; deletion removes it.
- Keep the assessment small and maintainable.

## Accessibility & Inclusion

Accessible labels, keyboard operation, responsive layout, readable status text, and clear pending/error states are required by the PRD.

## Open Decisions

No visual brand or assets are specified. Implementation assumes a restrained, light interface suitable for staff working at a service desk; this is an implementation choice, not a confirmed brand commitment.
