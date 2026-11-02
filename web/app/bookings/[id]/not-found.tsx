import Link from "next/link";

export default function BookingNotFound() {
  return (
    <section className="route-state">
      <h1>Booking not found</h1>
      <p>
        This appointment may have been deleted, or the booking number may be
        incorrect.
      </p>
      <Link className="button" href="/bookings">
        View bookings
      </Link>
    </section>
  );
}
