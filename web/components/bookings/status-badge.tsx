import type { BookingStatus } from "@/types/booking";

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={`status status-${status}`}>
      {status[0].toUpperCase() + status.slice(1)}
    </span>
  );
}
