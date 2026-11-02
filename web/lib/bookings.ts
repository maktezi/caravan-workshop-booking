import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { api, ApiError } from "./api";
import type { Booking, BookingPage, BookingStatus } from "@/types/booking";

export function listBookings(
  page: number,
  status?: BookingStatus,
): Promise<BookingPage> {
  const params = new URLSearchParams({ page: String(page) });
  if (status) params.set("status", status);
  return api<BookingPage>(`/bookings?${params}`);
}

export const getBooking = cache(async (id: string): Promise<Booking> => {
  if (!/^[1-9]\d*$/.test(id)) notFound();
  try {
    return (await api<{ data: Booking }>(`/bookings/${id}`)).data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
});
