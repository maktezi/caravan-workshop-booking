"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { saveBooking } from "@/app/actions/bookings";
import { DateTimeField } from "@/components/bookings/date-time-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  SERVICE_BAYS,
  STATUSES,
  type BookingField,
  type FormState,
  type FormValues,
} from "@/types/booking";

const emptyState: FormState = {
  values: {},
  errors: {},
  message: "",
  revision: 0,
};

export function BookingForm({
  id = null,
  initial = {},
}: {
  id?: number | null;
  initial?: Partial<FormValues>;
}) {
  const [state, action, pending] = useActionState(
    saveBooking.bind(null, id),
    emptyState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const values = {
    status: "pending",
    service_bay: "Bay 1",
    ...initial,
    ...state.values,
  };
  useEffect(() => {
    if (state.message) {
      const target =
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]') ??
        formRef.current?.querySelector<HTMLElement>('[role="alert"]');
      target?.focus();
    }
  }, [state]);
  const props = (name: BookingField) => ({
    id: name,
    name,
    defaultValue: values[name] ?? "",
    "aria-invalid": Boolean(state.errors[name]?.length),
    "aria-describedby": state.errors[name]?.length
      ? `${name}-error`
      : ["starts_at", "ends_at"].includes(name)
        ? "timezone-help"
        : undefined,
  });
  const error = (name: BookingField) =>
    state.errors[name]?.length ? (
      <p className="field-error" id={`${name}-error`}>
        {state.errors[name]?.join(" ")}
      </p>
    ) : null;
  return (
    <form
      ref={formRef}
      key={state.revision}
      action={action}
      className="booking-form"
      noValidate
    >
      {state.message && (
        <div className="notice notice-error" role="alert" tabIndex={-1}>
          {state.message}
        </div>
      )}
      <fieldset disabled={pending}>
        <legend>Customer &amp; caravan</legend>
        <p className="section-description">
          Contact details for this workshop visit.
        </p>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="customer_name">
              Customer name <span aria-hidden="true">*</span>
            </label>
            <input
              {...props("customer_name")}
              autoComplete="name"
              required
              maxLength={255}
            />
            {error("customer_name")}
          </div>
          <div className="field">
            <label htmlFor="customer_email">
              Email address <span aria-hidden="true">*</span>
            </label>
            <input
              {...props("customer_email")}
              type="email"
              autoComplete="email"
              required
              maxLength={255}
            />
            {error("customer_email")}
          </div>
          <div className="field">
            <label htmlFor="rego">
              Caravan registration <span aria-hidden="true">*</span>
            </label>
            <input
              {...props("rego")}
              required
              maxLength={50}
              autoCapitalize="characters"
            />
            {error("rego")}
          </div>
        </div>
      </fieldset>
      <fieldset disabled={pending}>
        <legend>Appointment</legend>
        <p className="section-description" id="timezone-help">
          Enter Melbourne local time. Daylight saving is handled automatically;
          skipped or repeated times must be changed.
        </p>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="service_bay">
              Service bay <span aria-hidden="true">*</span>
            </label>
            <Select name="service_bay" defaultValue={values.service_bay} disabled={pending}>
              <SelectTrigger id="service_bay" className="booking-select w-full rounded-[10px] bg-[#fcfdfa] px-4 shadow-none" aria-required="true" aria-invalid={Boolean(state.errors.service_bay?.length)} aria-describedby={state.errors.service_bay?.length ? "service_bay-error" : undefined}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                {SERVICE_BAYS.map((bay) => <SelectItem key={bay} value={bay}>{bay}</SelectItem>)}
              </SelectContent>
            </Select>
            {error("service_bay")}
          </div>
          <div className="field">
            <label htmlFor="status">
              Status <span aria-hidden="true">*</span>
            </label>
            <Select name="status" defaultValue={values.status} disabled={pending}>
              <SelectTrigger id="status" className="booking-select w-full rounded-[10px] bg-[#fcfdfa] px-4 shadow-none" aria-required="true" aria-invalid={Boolean(state.errors.status?.length)} aria-describedby={state.errors.status?.length ? "status-error" : undefined}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                {STATUSES.map((status) => <SelectItem key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
            {error("status")}
          </div>
          <div className="field">
            <label htmlFor="starts_at">
              Start date &amp; time <span aria-hidden="true">*</span>
            </label>
            <DateTimeField key={`starts_at-${state.revision}`} name="starts_at" defaultValue={values.starts_at ?? ""} invalid={Boolean(state.errors.starts_at?.length)} describedBy={state.errors.starts_at?.length ? "starts_at-error timezone-help" : "timezone-help"} disabled={pending} />
            {error("starts_at")}
          </div>
          <div className="field">
            <label htmlFor="ends_at">
              End date &amp; time <span aria-hidden="true">*</span>
            </label>
            <DateTimeField key={`ends_at-${state.revision}`} name="ends_at" defaultValue={values.ends_at ?? ""} invalid={Boolean(state.errors.ends_at?.length)} describedBy={state.errors.ends_at?.length ? "ends_at-error timezone-help" : "timezone-help"} disabled={pending} />
            {error("ends_at")}
          </div>
          <div className="field field-wide">
            <label htmlFor="notes">
              Notes <span className="optional">(optional)</span>
            </label>
            <textarea {...props("notes")} rows={4} />
            {error("notes")}
          </div>
        </div>
      </fieldset>
      <div className="form-footer">
        <p>Pending and confirmed bookings reserve the bay.</p>
        <div className="button-group">
          <Link
            className="button button-secondary"
            href={id ? `/bookings/${id}` : "/bookings"}
          >
            Back
          </Link>
          <button className="button" type="submit" disabled={pending}>
            {pending ? "Saving…" : id ? "Save changes" : "Create booking"}
          </button>
        </div>
      </div>
      <span role="status" className="sr-only">
        {pending ? "Saving your booking" : ""}
      </span>
    </form>
  );
}
