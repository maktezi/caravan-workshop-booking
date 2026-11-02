"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { melbourneToUtc } from "@/lib/timezone";
import {
  FORM_FIELDS,
  type Booking,
  type FormState,
  type FormValues,
  type MutationState,
} from "@/types/booking";

function refreshBookings(id?: number | string) {
  revalidatePath("/bookings");
  if (id) {
    revalidatePath(`/bookings/${id}`);
    revalidatePath(`/bookings/${id}/edit`);
  }
}

export async function saveBooking(
  id: number | null,
  previous: FormState,
  form: FormData,
): Promise<FormState> {
  const values = Object.fromEntries(
    FORM_FIELDS.map((field) => [field, String(form.get(field) ?? "")]),
  ) as FormValues;
  const state: FormState = {
    values,
    errors: {},
    message: "",
    revision: previous.revision + 1,
  };
  if (id !== null && (!Number.isSafeInteger(id) || id < 1)) {
    return {
      ...state,
      message:
        "This booking could not be found. Return to bookings and try again.",
    };
  }
  const timestamps: Record<string, string> = {};
  for (const field of ["starts_at", "ends_at"] as const) {
    try {
      timestamps[field] = melbourneToUtc(values[field]);
    } catch (error) {
      state.errors[field] = [
        error instanceof Error
          ? error.message
          : "Enter a valid Melbourne date and time.",
      ];
    }
  }
  if (Object.keys(state.errors).length)
    return { ...state, message: "Check the highlighted dates and try again." };
  let booking: Booking;
  try {
    const result = await api<{ data: Booking }>(
      id ? `/bookings/${id}` : "/bookings",
      {
        method: id ? "PUT" : "POST",
        body: JSON.stringify({
          ...values,
          ...timestamps,
          notes: values.notes || null,
        }),
      },
    );
    booking = result.data;
  } catch (error) {
    if (error instanceof ApiError) {
      return { ...state, errors: error.errors, message: error.message };
    }
    throw error;
  }
  refreshBookings(booking.id);
  redirect(`/bookings/${booking.id}?saved=${id ? "updated" : "created"}`);
}

export async function changeBooking(
  id: number,
  kind: "cancel" | "delete",
  previous: MutationState,
  form: FormData,
): Promise<MutationState> {
  if (
    !Number.isSafeInteger(id) ||
    id < 1 ||
    !["cancel", "delete"].includes(kind)
  )
    return { message: "This booking could not be found." };
  if (form.get("confirmed") !== "yes")
    return { message: "Confirm this action to continue." };
  try {
    await api(
      `/bookings/${id}`,
      kind === "delete"
        ? { method: "DELETE" }
        : { method: "PATCH", body: JSON.stringify({ status: "cancelled" }) },
    );
  } catch (error) {
    if (error instanceof ApiError) return { message: error.message };
    throw error;
  }
  refreshBookings(id);
  redirect(
    kind === "delete"
      ? "/bookings?success=deleted"
      : `/bookings/${id}?saved=cancelled`,
  );
}
