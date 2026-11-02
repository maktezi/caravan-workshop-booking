import Link from "next/link";
import { getBooking } from "@/lib/bookings";
import { formatDateTime } from "@/lib/timezone";
import { StatusBadge } from "@/components/bookings/status-badge";
import { BookingActions } from "@/components/bookings/booking-actions";

export const metadata = { title: "Booking details" };

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const [booking, query] = await Promise.all([getBooking(id), searchParams]);
  const saved = {
    created: "Booking created. Your appointment is now on the schedule.",
    updated: "Changes saved. Your appointment is up to date.",
    cancelled: "Booking cancelled. The service bay is available again.",
  }[query.saved ?? ""];
  return (
    <div className="detail-page">
      <Link className="back-link" href="/bookings">
        ← Bookings
      </Link>
      <div className="page-heading">
        <div>
          <h1>{booking.customer_name}</h1>
          <p>
            Booking #{booking.id} <span className="inline-divider">/</span>{" "}
            <span className="registration">{booking.rego}</span>
          </p>
        </div>
        <div className="button-group">
          <StatusBadge status={booking.status} />
          <Link className="button" href={`/bookings/${booking.id}/edit`}>
            Edit booking
          </Link>
        </div>
      </div>
      {saved && (
        <p className="notice notice-success" role="status">
          {saved}
        </p>
      )}
      <section className="detail-sheet" aria-label="Booking details">
        <div className="appointment-summary">
          <div>
            <span className="detail-label">Service bay</span>
            <strong className="bay-name">{booking.service_bay}</strong>
          </div>
          <div>
            <span className="detail-label">Starts · Melbourne</span>
            <strong>{formatDateTime(booking.starts_at)}</strong>
          </div>
          <div>
            <span className="detail-label">Ends · Melbourne</span>
            <strong>{formatDateTime(booking.ends_at)}</strong>
          </div>
        </div>
        <div className="detail-section">
          <h2>Customer &amp; caravan</h2>
          <dl className="detail-grid">
            <div>
              <dt>Customer name</dt>
              <dd>{booking.customer_name}</dd>
            </div>
            <div>
              <dt>Email address</dt>
              <dd>
                <a href={`mailto:${booking.customer_email}`}>
                  {booking.customer_email}
                </a>
              </dd>
            </div>
            <div>
              <dt>Caravan registration</dt>
              <dd className="registration">{booking.rego}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge status={booking.status} />
              </dd>
            </div>
          </dl>
        </div>
        <div className="detail-section">
          <h2>Notes</h2>
          <p className="notes-text">
            {booking.notes || "No notes for this appointment."}
          </p>
        </div>
        <div className="record-meta">
          <span>Created {formatDateTime(booking.created_at)}</span>
          <span>Updated {formatDateTime(booking.updated_at)}</span>
        </div>
      </section>
      <BookingActions
        key={`${booking.id}:${booking.status}`}
        booking={booking}
      />
    </div>
  );
}
