"use client";

import Link from "next/link";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="route-state" role="alert">
      <h1>We couldn’t load the workshop</h1>
      <p>
        The booking service may be temporarily unavailable. Your saved bookings
        are kept safe. Try again in a moment.
      </p>
      <div className="button-group">
        <button className="button" onClick={reset}>
          Try again
        </button>
        <Link className="button button-secondary" href="/bookings">
          Back to bookings
        </Link>
      </div>
    </section>
  );
}
