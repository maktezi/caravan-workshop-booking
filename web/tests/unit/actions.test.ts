import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import type { FormState } from "../../types/booking";

mock.module("server-only", () => ({}));
const invalidated: string[] = [];
mock.module("next/cache", () => ({
  revalidatePath: (path: string) => {
    invalidated.push(path);
  },
}));
class RedirectSignal extends Error {
  constructor(public destination: string) {
    super(destination);
  }
}
mock.module("next/navigation", () => ({
  redirect: (path: string): never => {
    throw new RedirectSignal(path);
  },
}));
const { saveBooking, changeBooking } =
  await import("../../app/actions/bookings");
const { api, ApiError } = await import("../../lib/api");
const originalFetch = globalThis.fetch;
const initial: FormState = { values: {}, errors: {}, message: "", revision: 0 };
let requests: { url: string; options?: RequestInit }[] = [];
let respond: (
  url: string,
  options?: RequestInit,
) => Response | Promise<Response>;

function form(overrides: Record<string, string> = {}) {
  const values = {
    customer_name: "Alex Smith",
    customer_email: "alex@example.com",
    rego: "VIC-123",
    service_bay: "Bay 1",
    starts_at: "2026-11-03T09:00",
    ends_at: "2026-11-03T10:00",
    status: "pending",
    notes: "",
    ...overrides,
  };
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

beforeEach(() => {
  invalidated.length = 0;
  requests = [];
  respond = () => Response.json({ data: { id: 42 } });
  globalThis.fetch = Object.assign(
    async (input: RequestInfo | URL, options?: RequestInit) => {
      requests.push({ url: String(input), options });
      return respond(String(input), options);
    },
    { preconnect: originalFetch.preconnect },
  );
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("booking Server Actions", () => {
  test("creates through the API with normalized UTC then invalidates and redirects", async () => {
    await expect(saveBooking(null, initial, form())).rejects.toThrow(
      "/bookings/42?saved=created",
    );
    expect(requests[0].url.endsWith("/api/bookings")).toBe(true);
    expect(requests[0].options?.method).toBe("POST");
    expect(requests[0].options?.cache).toBe("no-store");
    expect(JSON.parse(requests[0].options?.body as string)).toMatchObject({
      starts_at: "2026-11-02T22:00:00.000Z",
      ends_at: "2026-11-02T23:00:00.000Z",
      notes: null,
    });
    expect(invalidated).toEqual([
      "/bookings",
      "/bookings/42",
      "/bookings/42/edit",
    ]);
  });
  test("updates an existing booking through PUT", async () => {
    await expect(saveBooking(42, initial, form())).rejects.toThrow(
      "saved=updated",
    );
    expect(requests[0].url.endsWith("/bookings/42")).toBe(true);
    expect(requests[0].options?.method).toBe("PUT");
  });
  test("preserves submitted values and Laravel field errors after a conflict", async () => {
    respond = () =>
      Response.json(
        {
          message: "Conflict",
          errors: {
            service_bay: [
              "This bay already has a booking during the selected time.",
            ],
          },
        },
        { status: 422 },
      );
    const state = await saveBooking(
      null,
      initial,
      form({ notes: "Keep this note" }),
    );
    expect(state.values.notes).toBe("Keep this note");
    expect(state.values.starts_at).toBe("2026-11-03T09:00");
    expect(state.errors.service_bay?.[0]).toContain("already has a booking");
    expect(state.revision).toBe(1);
    expect(invalidated).toEqual([]);
  });
  test("rejects ambiguous Melbourne times before calling the API", async () => {
    const state = await saveBooking(
      null,
      initial,
      form({ starts_at: "2026-04-05T02:30", ends_at: "2026-04-05T03:30" }),
    );
    expect(state.errors.starts_at?.[0]).toContain("occurs twice");
    expect(requests).toHaveLength(0);
  });
  test("rejects skipped Melbourne times before calling the API", async () => {
    const state = await saveBooking(
      null,
      initial,
      form({ starts_at: "2026-10-04T02:30" }),
    );
    expect(state.errors.starts_at?.[0]).toContain("does not exist");
    expect(requests).toHaveLength(0);
  });
  test("returns a recoverable error when the API is offline", async () => {
    respond = () => {
      throw new TypeError("connection failed");
    };
    const state = await saveBooking(null, initial, form());
    expect(state.message).toContain("unavailable");
    expect(state.values.customer_name).toBe("Alex Smith");
  });
  test("handles an API server error without exposing response content", async () => {
    respond = () => new Response("private stack trace", { status: 500 });
    const state = await saveBooking(42, initial, form());
    expect(state.message).toContain("try again");
    expect(state.message).not.toContain("private");
  });
  test("requires confirmation before cancelling or deleting", async () => {
    const state = await changeBooking(
      42,
      "delete",
      { message: "" },
      new FormData(),
    );
    expect(state.message).toContain("Confirm");
    expect(requests).toHaveLength(0);
  });
  test("cancels with PATCH and revalidates details", async () => {
    const data = new FormData();
    data.set("confirmed", "yes");
    await expect(
      changeBooking(42, "cancel", { message: "" }, data),
    ).rejects.toThrow("saved=cancelled");
    expect(requests[0].options?.method).toBe("PATCH");
    expect(JSON.parse(requests[0].options?.body as string)).toEqual({
      status: "cancelled",
    });
    expect(invalidated).toContain("/bookings/42");
  });
  test("deletes through the DELETE endpoint and redirects to the list", async () => {
    respond = () => new Response(null, { status: 204 });
    const data = new FormData();
    data.set("confirmed", "yes");
    await expect(
      changeBooking(42, "delete", { message: "" }, data),
    ).rejects.toThrow("/bookings?success=deleted");
    expect(requests[0].options?.method).toBe("DELETE");
    expect(invalidated).toContain("/bookings");
  });
  test("reports records deleted by another user", async () => {
    respond = () => Response.json({ message: "Missing" }, { status: 404 });
    const state = await saveBooking(42, initial, form());
    expect(state.message).toContain("could not be found");
  });
  test("treats a non-JSON successful response as a service failure", async () => {
    respond = () => new Response("not JSON", { status: 200 });
    await expect(api("/bookings")).rejects.toBeInstanceOf(ApiError);
  });
});
