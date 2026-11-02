import Link from "next/link";
import { redirect } from "next/navigation";
import { listBookings } from "@/lib/bookings";
import { formatDateTime } from "@/lib/timezone";
import { STATUSES, type BookingStatus } from "@/types/booking";
import { StatusBadge } from "@/components/bookings/status-badge";
import { Pagination } from "@/components/bookings/pagination";
import { WorkspaceIcon } from "@/components/workspace-icon";

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const status =
    typeof query.status === "string" &&
    STATUSES.includes(query.status as BookingStatus)
      ? (query.status as BookingStatus)
      : undefined;
  const page =
    typeof query.page === "string" && /^[1-9]\d*$/.test(query.page)
      ? Number(query.page)
      : 1;
  if (
    (query.status && !status) ||
    (query.page && (!Number.isSafeInteger(page) || String(page) !== query.page))
  )
    redirect("/bookings");
  const result = await listBookings(page, status);
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Bookings <span className="heading-count">{result.meta.total}</span></h1>
          <p>Keep every caravan visit on schedule.</p>
        </div>
        <Link className="button" href="/bookings/new">
          <WorkspaceIcon name="plus" width="18" height="18" /> New booking
        </Link>
      </div>
      {query.success === "deleted" && (
        <p className="notice notice-success" role="status">
          Booking deleted. The appointment has been permanently removed.
        </p>
      )}
      <section className="booking-register" aria-label="Workshop bookings">
        <div className="register-toolbar">
          <nav className="status-tabs" aria-label="Filter by booking status">
            {[undefined, ...STATUSES].map((item) => (
              <Link
                key={item ?? "all"}
                aria-current={status === item ? "page" : undefined}
                href={item ? `/bookings?status=${item}` : "/bookings"}
              >
                {item ? item[0].toUpperCase() + item.slice(1) : "All bookings"}
              </Link>
            ))}
          </nav>
          <span className="timezone-label"><WorkspaceIcon name="clock" width="14" height="14" />Melbourne time</span>
        </div>
        {result.data.length ? (
          <div
            className="table-scroll"
            role="region"
            aria-label="Booking list"
            tabIndex={0}
          >
            <table>
              <caption className="sr-only">
                Caravan workshop appointments, ordered by start time
              </caption>
              <thead>
                <tr>
                  <th scope="col">Customer</th>
                  <th scope="col">Registration</th>
                  <th scope="col">Service bay</th>
                  <th scope="col">Starts</th>
                  <th scope="col">Ends</th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <Link
                        className="customer-link"
                        href={`/bookings/${booking.id}`}
                      >
                        {booking.customer_name}
                      </Link>
                      <span className="cell-secondary">
                        Booking #{booking.id}
                      </span>
                    </td>
                    <td className="registration">{booking.rego}</td>
                    <td>{booking.service_bay}</td>
                    <td className="date-cell">
                      {formatDateTime(booking.starts_at)}
                    </td>
                    <td className="date-cell">
                      {formatDateTime(booking.ends_at)}
                    </td>
                    <td>
                      <StatusBadge status={booking.status} />
                    </td>
                    <td>
                      <Link
                        className="table-action"
                        href={`/bookings/${booking.id}`}
                        aria-label={`View booking for ${booking.customer_name}`}
                      >
                        View<span aria-hidden="true"> →</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-bay" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <h2>
              {page > 1
                ? "No bookings on this page"
                : status
                  ? `No ${status} bookings`
                  : "Your workshop schedule starts here"}
            </h2>
            <p>
              {page > 1
                ? "Try the first page to see available records."
                : status
                  ? "Choose another status or create a new appointment."
                  : "Add your first appointment to reserve a service bay."}
            </p>
            <Link
              className="button button-secondary"
              href={
                page > 1
                  ? `/bookings${status ? `?status=${status}` : ""}`
                  : status
                    ? "/bookings"
                    : "/bookings/new"
              }
            >
              {page > 1
                ? "Go to first page"
                : status
                  ? "View all bookings"
                  : "Create a booking"}
            </Link>
          </div>
        )}
        <Pagination meta={result.meta} status={status} />
      </section>
      <p className="schedule-note">
        Four service bays. Pending and confirmed appointments reserve their bay;
        cancelled appointments release it.
      </p>
    </>
  );
}
