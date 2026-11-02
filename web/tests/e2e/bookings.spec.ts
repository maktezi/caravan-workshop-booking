import { expect, test, type Page } from "@playwright/test";
import { format, parseISO } from "date-fns";

async function chooseBay(page: Page, bay: string) {
  await page.getByRole("combobox", { name: "Service bay" }).click();
  await page.getByRole("option", { name: bay, exact: true }).click();
}

async function fillDateTime(page: Page, kind: "Start" | "End", value: string) {
  const [date, time] = value.split("T");
  await page.getByLabel(`${kind} date & time`).click();
  const calendar = page.getByRole("dialog", { name: `Choose ${kind.toLowerCase()} date`, exact: true });
  await calendar.getByRole("combobox", { name: "Choose the Year" }).selectOption(date.slice(0, 4));
  await calendar.getByRole("combobox", { name: "Choose the Month" }).selectOption(String(Number(date.slice(5, 7)) - 1));
  await calendar.getByRole("button", { name: format(parseISO(date), "PPPP"), exact: true }).click();
  await expect(calendar).not.toBeVisible();
  await page.getByLabel(`${kind} time`, { exact: true }).fill(time.slice(0, 5));
}

async function fillAppointment(page: Page, customer: string) {
  await page.getByLabel("Customer name").fill(customer);
  await page.getByLabel("Email address").fill("workshop@example.com");
  await page.getByLabel("Caravan registration").fill("TEST-123");
  await chooseBay(page, "Bay 4");
  await fillDateTime(page, "Start", "2030-11-03T09:00:00");
  await fillDateTime(page, "End", "2030-11-03T10:00:00");
}

test("staff can create, edit, cancel and delete an appointment", async ({
  page,
}) => {
  await page.goto("/bookings/new");
  const name = `Workshop test ${Date.now()}`;
  await fillAppointment(page, name);
  await page.getByRole("button", { name: "Create booking" }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Booking created");
  await page.getByRole("link", { name: "Edit booking" }).click();
  await expect(page.getByLabel("Start date & time")).toContainText(
    "03 Nov 2030",
  );
  await expect(page.getByLabel("Start time", { exact: true })).toHaveValue("09:00");
  await page.getByLabel("Notes").fill("Inspect the water pump.");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Inspect the water pump.")).toBeVisible();
  await page
    .getByRole("button", { name: "Cancel booking", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Keep booking" }).click();
  await expect(dialog).not.toBeVisible();
  await page
    .getByRole("button", { name: "Cancel booking", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel booking", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Booking cancelled");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Already cancelled" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Delete booking" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete booking" })
    .click();
  await expect(page).toHaveURL(/\/bookings\?success=deleted$/);
  await expect(page.getByRole("status")).toContainText("Booking deleted");
});

test("required and email errors appear inline without browser validation", async ({
  page,
}) => {
  await page.goto("/bookings/new");
  await fillAppointment(page, "Preserved customer");
  await page.getByLabel("Email address").fill("invalid-email");
  await page.getByLabel("Caravan registration").fill("");
  await page.getByLabel("Notes").fill("Keep these notes.");
  await page.getByRole("button", { name: "Create booking" }).click();

  await expect(page.locator("#customer_email-error")).toBeVisible();
  await expect(page.locator("#rego-error")).toContainText("required");
  await expect(page.getByLabel("Email address")).toBeFocused();
  await expect(page.getByLabel("Email address")).toHaveValue("invalid-email");
  await expect(page.getByLabel("Customer name")).toHaveValue("Preserved customer");
  await expect(page.getByLabel("Notes")).toHaveValue("Keep these notes.");
});

for (const end of ["2030-11-02T10:00", "2030-11-03T09:00"]) {
  test(`Laravel rejects end ${end} without restricting calendar selection`, async ({ page }) => {
    await page.goto("/bookings/new");
    await fillAppointment(page, "Date validation customer");
    if (end.startsWith("2030-11-03")) {
      await page.getByLabel("End time", { exact: true }).fill(end.split("T")[1]);
    } else {
      await fillDateTime(page, "End", end);
    }
    await page.getByRole("button", { name: "Create booking" }).click();

    await expect(page.locator("#ends_at-error")).toHaveText(
      "The end time must be later than the start time.",
    );
    await expect(page.getByLabel("End date & time")).toBeFocused();
    await expect(page.getByLabel("End date & time")).toContainText(
      format(parseISO(end), "dd MMM yyyy"),
    );
    await expect(page.getByLabel("End time", { exact: true })).toHaveValue(end.split("T")[1]);
    await expect(page.getByLabel("Customer name")).toHaveValue("Date validation customer");
  });
}

test("empty dates show inline feedback without browser validation", async ({ page }) => {
  await page.goto("/bookings/new");
  await page.getByRole("button", { name: "Create booking" }).click();

  await expect(page.locator("#starts_at-error")).toBeVisible();
  await expect(page.locator("#ends_at-error")).toBeVisible();
  await expect(page.getByLabel("Start date & time")).toBeFocused();
});

test("calendar selection preserves Melbourne date and time and supports keyboard dismissal", async ({ page }) => {
  await page.goto("/bookings/new");
  await expect(page.getByLabel("Start date & time")).toBeVisible();
  await expect(page.getByLabel("Start time", { exact: true })).toBeVisible();
  const dateBox = await page.getByLabel("Start date & time").boundingBox();
  const timeBox = await page.getByLabel("Start time", { exact: true }).boundingBox();
  expect(dateBox?.height).toBe(48);
  expect(timeBox?.height).toBe(48);
  await fillDateTime(page, "Start", "2030-11-03T09:15:30");
  await page.getByLabel("Start date & time").click();
  await page.getByRole("button", { name: "Monday, November 4th, 2030", exact: true }).click();
  await expect(page.getByLabel("Start date & time")).toContainText("04 Nov 2030");
  await expect(page.getByLabel("Start time", { exact: true })).toHaveValue("09:15");
  await expect(page.getByLabel("Start time", { exact: true })).toHaveAttribute("step", "60");
  await expect(page.locator('input[name="starts_at"]')).toHaveValue("2030-11-04T09:15");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByLabel("Start date & time").click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByLabel("Start date & time")).toBeFocused();
});

test("list filtering and pagination are reflected in the URL", async ({
  page,
}) => {
  await page.goto("/bookings");
  await expect(page.getByRole("row")).toHaveCount(11);
  await page.getByRole("link", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await page.getByRole("navigation", { name: "Filter by booking status" }).getByRole("link", { name: "Confirmed", exact: true }).click();
  await expect(page).toHaveURL(/status=confirmed$/);
  await expect(page.getByRole("row")).toHaveCount(9);
  await expect(page.locator("tbody .status")).toHaveText(
    Array(8).fill("Confirmed"),
  );
});

test("conflicts preserve form values and display field errors", async ({
  page,
  request,
}) => {
  const starts = "2031-11-03T00:00:00Z";
  const ends = "2031-11-03T01:00:00Z";
  const created = await request.post("http://127.0.0.1:18000/api/bookings", {
    data: {
      customer_name: "Existing booking",
      customer_email: "existing@example.com",
      rego: "BLOCK-1",
      service_bay: "Bay 1",
      starts_at: starts,
      ends_at: ends,
      status: "confirmed",
    },
  });
  expect(created.status()).toBe(201);
  const id = (await created.json()).data.id;
  try {
    await page.goto("/bookings/new");
    await fillAppointment(page, "Preserved customer");
    await chooseBay(page, "Bay 1");
    await fillDateTime(page, "Start", "2031-11-03T11:00:00");
    await fillDateTime(page, "End", "2031-11-03T12:00:00");
    await page.getByLabel("Notes").fill("Preserve these notes.");
    await page.getByRole("button", { name: "Create booking" }).click();
    await expect(
      page.getByText(
        "This bay already has a booking during the selected time.",
      ),
    ).toBeVisible();
    await expect(page.getByLabel("Customer name")).toHaveValue(
      "Preserved customer",
    );
    await expect(page.getByLabel("Notes")).toHaveValue("Preserve these notes.");
    await expect(page.getByLabel("Service bay")).toBeFocused();
  } finally {
    await request.delete(`http://127.0.0.1:18000/api/bookings/${id}`);
  }
});

test("DST gaps and missing bookings have recoverable states", async ({
  page,
}) => {
  await page.goto("/bookings/new");
  await fillAppointment(page, "DST customer");
  await fillDateTime(page, "Start", "2026-10-04T02:30:00");
  await page.getByRole("button", { name: "Create booking" }).click();
  await expect(
    page.getByText(/does not exist because daylight saving/),
  ).toBeVisible();
  await page.goto("/bookings/99999999");
  await expect(
    page.getByRole("heading", { name: "Booking not found" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "View bookings" })).toBeVisible();
});

test("an empty page offers a path back to the schedule", async ({ page }) => {
  await page.goto("/bookings?page=999");
  await expect(
    page.getByRole("heading", { name: "No bookings on this page" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Go to first page" }).click();
  await expect(page.getByRole("row")).toHaveCount(11);
});
