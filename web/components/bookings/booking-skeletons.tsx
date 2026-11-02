import type { CSSProperties, ReactNode } from "react";
import { STATUSES } from "@/types/booking";

function Skeleton({
  width = "100%",
  height,
}: {
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
}) {
  return <span className="skeleton" style={{ width, height }} />;
}

function LoadingFrame({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section aria-busy="true" role="status">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">{children}</div>
    </section>
  );
}

function Heading({
  title,
  back = false,
  action = false,
  status = false,
  description,
}: {
  title?: string;
  back?: boolean;
  action?: boolean;
  status?: boolean;
  description?: ReactNode;
}) {
  return (
    <>
      {back && (
        <span className="back-link">
          <Skeleton width={110} />
        </span>
      )}
      <div className="page-heading">
        <div>
          <h1>
            {title ?? <Skeleton width="min(320px, 65vw)" />}
            {title === "Bookings" && (
              <span className="heading-count">
                <Skeleton width={18} height={12} />
              </span>
            )}
          </h1>
          <p>{description ?? <Skeleton width="min(240px, 70vw)" />}</p>
        </div>
        {action && (
          <div className="button-group">
            {status && <Skeleton width={90} height={28} />}
            <span className="button skeleton skeleton-button">
              Loading action
            </span>
          </div>
        )}
      </div>
    </>
  );
}

export function BookingListSkeleton() {
  return (
    <LoadingFrame label="Loading bookings">
      <Heading
        title="Bookings"
        description="Keep every caravan visit on schedule."
        action
      />
      <div className="booking-register">
        <div className="register-toolbar">
          <div className="status-tabs">
            {[
              "All bookings",
              ...STATUSES.map(
                (status) => status[0].toUpperCase() + status.slice(1),
              ),
            ].map((label) => (
              <span className="skeleton-tab" key={label}>
                <span className="skeleton">{label}</span>
              </span>
            ))}
          </div>
          <span className="timezone-label">
            <Skeleton width={110} />
          </span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {[
                  "Customer",
                  "Registration",
                  "Service bay",
                  "Starts",
                  "Ends",
                  "Status",
                  "",
                ].map((label, i) => (
                  <th key={i}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }, (_, i) => (
                <tr key={i}>
                  <td>
                    <span className="customer-link">
                      <Skeleton width={i % 2 ? 135 : 115} />
                    </span>
                    <span className="cell-secondary">
                      <Skeleton width={68} height={9} />
                    </span>
                  </td>
                  <td className="registration">
                    <Skeleton width={75} />
                  </td>
                  <td>
                    <Skeleton width={40} />
                  </td>
                  <td className="date-cell">
                    <Skeleton width={128} />
                  </td>
                  <td className="date-cell">
                    <Skeleton width={128} />
                  </td>
                  <td>
                    <Skeleton width={86} height={27} />
                  </td>
                  <td>
                    <Skeleton width={45} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <p>
            <Skeleton width={125} />
          </p>
          <div className="pagination-controls">
            <span className="button button-secondary skeleton">Previous</span>
            <Skeleton width={78} />
            <span className="button button-secondary skeleton">Next</span>
          </div>
        </div>
      </div>
      <p className="schedule-note">
        <Skeleton width="min(700px, 100%)" />
      </p>
    </LoadingFrame>
  );
}

export function BookingDetailSkeleton() {
  return (
    <LoadingFrame label="Loading booking details">
      <div className="detail-page">
        <Heading back action status />
        <div className="detail-sheet">
          <div className="appointment-summary">
            {["Service bay", "Starts · Melbourne", "Ends · Melbourne"].map(
              (label, i) => (
                <div key={label}>
                  <span className="detail-label">{label}</span>
                  <strong className={i === 0 ? "bay-name" : undefined}>
                    <Skeleton width={i === 0 ? 70 : "min(220px, 100%)"} />
                  </strong>
                </div>
              ),
            )}
          </div>
          <div className="detail-section">
            <h2>Customer &amp; caravan</h2>
            <dl className="detail-grid">
              {[
                "Customer name",
                "Email address",
                "Caravan registration",
                "Status",
              ].map((label) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>
                    <Skeleton width={label === "Status" ? 90 : "60%"} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="detail-section">
            <h2>Notes</h2>
            <p className="notes-text">
              <Skeleton width="85%" />
            </p>
          </div>
          <div className="record-meta">
            <Skeleton width={190} />
            <Skeleton width={190} />
          </div>
        </div>
        <div className="record-actions">
          <div>
            <h2>Manage booking</h2>
            <p>
              <Skeleton width={280} />
            </p>
          </div>
          <div className="button-group">
            <span className="button button-secondary skeleton">
              Cancel booking
            </span>
            <span className="button button-secondary skeleton">
              Delete booking
            </span>
          </div>
        </div>
      </div>
    </LoadingFrame>
  );
}

function FieldSkeleton({
  label,
  wide = false,
  notes = false,
  dateTime = false,
}: {
  label: string;
  wide?: boolean;
  notes?: boolean;
  dateTime?: boolean;
}) {
  return (
    <div className={`field${wide ? " field-wide" : ""}`}>
      <span className="skeleton-label">{label}</span>
      {dateTime ? (
        <div className="datetime-fields">
          <Skeleton height={48} />
          <Skeleton height={48} />
        </div>
      ) : (
        <Skeleton height={notes ? 114 : 48} />
      )}
    </div>
  );
}

export function BookingFormSkeleton({
  editing = false,
}: {
  editing?: boolean;
}) {
  return (
    <LoadingFrame
      label={editing ? "Loading booking form" : "Loading new booking"}
    >
      <div className="form-page">
        <Heading
          title={editing ? "Edit booking" : "New booking"}
          back
          description={
            editing ? (
              <>
                Update the appointment for <Skeleton width={120} />. Fields
                marked * are required.
              </>
            ) : (
              "Reserve a service bay for a caravan visit. Fields marked * are required."
            )
          }
        />
        <div className="booking-form">
          <fieldset disabled>
            <legend>Customer &amp; caravan</legend>
            <p className="section-description">
              Contact details for this workshop visit.
            </p>
            <div className="form-grid">
              {["Customer name", "Email address", "Caravan registration"].map(
                (label) => (
                  <FieldSkeleton
                    label={label}
                    key={label}
                    dateTime={
                      label === "Start date & time" ||
                      label === "End date & time"
                    }
                  />
                ),
              )}
            </div>
          </fieldset>
          <fieldset disabled>
            <legend>Appointment</legend>
            <p className="section-description">
              Enter Melbourne local time. Daylight saving is handled
              automatically; skipped or repeated times must be changed.
            </p>
            <div className="form-grid">
              {[
                "Service bay",
                "Status",
                "Start date & time",
                "End date & time",
              ].map((label) => (
                <FieldSkeleton
                  label={label}
                  key={label}
                  dateTime={
                    label === "Start date & time" || label === "End date & time"
                  }
                />
              ))}
              <FieldSkeleton label="Notes (optional)" wide notes />
            </div>
          </fieldset>
          <div className="form-footer">
            <p>Pending and confirmed bookings reserve the bay.</p>
            <div className="button-group">
              <span className="button button-secondary skeleton">Back</span>
              <span className="button skeleton">
                {editing ? "Save changes" : "Create booking"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </LoadingFrame>
  );
}
