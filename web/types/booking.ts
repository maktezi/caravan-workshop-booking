export const STATUSES = ["pending", "confirmed", "cancelled"] as const;
export const SERVICE_BAYS = ["Bay 1", "Bay 2", "Bay 3", "Bay 4"] as const;
export type BookingStatus = (typeof STATUSES)[number];
export type Booking = {
  id: number;
  customer_name: string;
  customer_email: string;
  rego: string;
  service_bay: (typeof SERVICE_BAYS)[number];
  starts_at: string;
  ends_at: string;
  status: BookingStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
export type BookingPage = {
  data: Booking[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
};
export const FORM_FIELDS = [
  "customer_name",
  "customer_email",
  "rego",
  "service_bay",
  "starts_at",
  "ends_at",
  "status",
  "notes",
] as const;
export type BookingField = (typeof FORM_FIELDS)[number];
export type FormValues = Record<BookingField, string>;
export type FormState = {
  values: Partial<FormValues>;
  errors: Partial<Record<BookingField, string[]>>;
  message: string;
  revision: number;
};
export type MutationState = { message: string };
