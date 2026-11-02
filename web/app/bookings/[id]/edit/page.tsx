import Link from "next/link";
import { getBooking } from "@/lib/bookings";
import { toLocalInput } from "@/lib/timezone";
import { BookingForm } from "@/components/bookings/booking-form";

export const metadata = { title: "Edit booking" };

export default async function EditBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booking = await getBooking(id);
  return (
    <div className="form-page">
      <Link className="back-link" href={`/bookings/${booking.id}`}>
        ← Booking #{booking.id}
      </Link>
      <div className="page-heading">
        <div>
          <h1>Edit booking</h1>
          <p>
            Update the appointment for {booking.customer_name}. Fields marked *
            are required.
          </p>
        </div>
      </div>
      <BookingForm
        id={booking.id}
        initial={{
          ...booking,
          notes: booking.notes ?? "",
          starts_at: toLocalInput(booking.starts_at),
          ends_at: toLocalInput(booking.ends_at),
        }}
      />
    </div>
  );
}
