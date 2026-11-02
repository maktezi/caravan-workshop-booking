export const WORKSHOP_TIMEZONE = "Australia/Melbourne";

const inputFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: WORKSHOP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export function toLocalInput(instant: string | Date): string {
  const parts = Object.fromEntries(
    inputFormatter
      .formatToParts(new Date(instant))
      .map(({ type, value }) => [type, value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
}

export function melbourneToUtc(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
    value,
  );
  if (!match) throw new Error("Enter a valid date and time.");
  const [, year, month, day, hour, minute, second = "00"] = match;
  const normalized = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  const localEpoch = Date.parse(`${normalized}Z`);
  if (
    !Number.isFinite(localEpoch) ||
    new Date(localEpoch).toISOString().slice(0, 19) !== normalized
  ) {
    throw new Error("Enter a valid date and time.");
  }
  // Discover actual IANA offsets on both sides of a possible Melbourne DST change.
  const offsets = new Set<number>();
  for (const hours of [-36, -12, 0, 12, 36]) {
    const sample = localEpoch + hours * 3_600_000;
    offsets.add(Date.parse(`${toLocalInput(new Date(sample))}Z`) - sample);
  }
  const candidates = [...offsets]
    .map((offset) => localEpoch - offset)
    .filter((instant) => toLocalInput(new Date(instant)) === normalized);
  if (candidates.length === 0) {
    throw new Error(
      "This Melbourne time does not exist because daylight saving starts. Choose another time.",
    );
  }
  if (candidates.length > 1) {
    throw new Error(
      "This Melbourne time occurs twice because daylight saving ends. Choose a time outside the repeated hour.",
    );
  }
  return new Date(candidates[0]).toISOString();
}

export function formatDateTime(instant: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: WORKSHOP_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(instant));
}
