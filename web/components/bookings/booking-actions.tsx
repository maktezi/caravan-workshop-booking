"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { changeBooking } from "@/app/actions/bookings";
import type { Booking } from "@/types/booking";

function Confirmation({
  booking,
  kind,
  close,
}: {
  booking: Booking;
  kind: "cancel" | "delete";
  close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState(
    changeBooking.bind(null, booking.id, kind),
    { message: "" },
  );
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-labelledby="confirmation-title"
      aria-describedby="confirmation-description"
      onClose={close}
      onCancel={(event) => {
        if (pending) event.preventDefault();
      }}
    >
      <h2 id="confirmation-title">
        {kind === "delete" ? "Delete this booking?" : "Cancel this booking?"}
      </h2>
      <p id="confirmation-description">
        {booking.customer_name} · {booking.rego}.{" "}
        {kind === "delete"
          ? "This permanently removes the appointment and cannot be undone."
          : "This releases the service bay and keeps the appointment in your booking history."}
      </p>
      {state.message && (
        <p className="notice notice-error" role="alert">
          {state.message}
        </p>
      )}
      <form action={action} className="dialog-actions">
        <input type="hidden" name="confirmed" value="yes" />
        <button
          className="button button-secondary"
          type="button"
          disabled={pending}
          onClick={() => dialog.current?.close()}
        >
          Keep booking
        </button>
        <button
          className={`button ${kind === "delete" ? "button-danger" : ""}`}
          type="submit"
          disabled={pending}
        >
          {pending
            ? "Please wait…"
            : kind === "delete"
              ? "Delete booking"
              : "Cancel booking"}
        </button>
      </form>
    </dialog>
  );
}

export function BookingActions({ booking }: { booking: Booking }) {
  const [kind, setKind] = useState<"cancel" | "delete" | null>(null);
  return (
    <>
      <div className="record-actions">
        <div>
          <h2>Manage booking</h2>
          <p>Cancellation keeps the record. Deletion is permanent.</p>
        </div>
        <div className="button-group">
          <button
            className="button button-secondary"
            disabled={booking.status === "cancelled"}
            onClick={() => setKind("cancel")}
          >
            {booking.status === "cancelled"
              ? "Already cancelled"
              : "Cancel booking"}
          </button>
          <button
            className="button button-outline-danger"
            onClick={() => setKind("delete")}
          >
            Delete booking
          </button>
        </div>
      </div>
      {kind && (
        <Confirmation
          booking={booking}
          kind={kind}
          close={() => setKind(null)}
        />
      )}
    </>
  );
}
