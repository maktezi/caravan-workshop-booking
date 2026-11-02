import Link from "next/link";
import type { BookingPage, BookingStatus } from "@/types/booking";

export function Pagination({
  meta,
  status,
}: {
  meta: BookingPage["meta"];
  status?: BookingStatus;
}) {
  const href = (page: number) =>
    `/bookings?${new URLSearchParams({ ...(status ? { status } : {}), page: String(page) })}`;
  return (
    <nav className="pagination" aria-label="Booking pagination">
      <p>
        {meta.from
          ? `${meta.from}–${meta.to} of ${meta.total} bookings`
          : `${meta.total} bookings`}
      </p>
      <div className="pagination-controls">
        {meta.current_page > 1 ? (
          <Link
            className="button button-secondary"
            href={href(meta.current_page - 1)}
          >
            Previous
          </Link>
        ) : (
          <span className="button button-secondary" aria-disabled="true">
            Previous
          </span>
        )}
        <span>
          Page {meta.current_page} of{" "}
          {Math.max(meta.last_page, meta.current_page)}
        </span>
        {meta.current_page < meta.last_page ? (
          <Link
            className="button button-secondary"
            href={href(meta.current_page + 1)}
          >
            Next
          </Link>
        ) : (
          <span className="button button-secondary" aria-disabled="true">
            Next
          </span>
        )}
      </div>
    </nav>
  );
}
