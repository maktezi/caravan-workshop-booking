import Link from "next/link";
import { BookingForm } from "@/components/bookings/booking-form";

export const metadata = { title: "New booking" };

export default function NewBookingPage() {
  return (
    <div className="form-page">
      <Link className="back-link" href="/bookings">
        ← Bookings
      </Link>
      <div className="page-heading">
        <div>
          <h1>New booking</h1>
          <p>
            Reserve a service bay for a caravan visit. Fields marked * are
            required.
          </p>
        </div>
      </div>
      <BookingForm />
    </div>
  );
}
