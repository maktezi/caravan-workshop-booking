import Link from "next/link";

export default function NotFound() {
  return (
    <section className="route-state">
      <h1>This page isn’t here</h1>
      <p>Check the address or return to the workshop schedule.</p>
      <Link className="button" href="/bookings">
        View bookings
      </Link>
    </section>
  );
}
