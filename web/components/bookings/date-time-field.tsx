"use client";

import { useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function DateTimeField({
  name,
  defaultValue,
  invalid,
  describedBy,
  disabled,
}: {
  name: "starts_at" | "ends_at";
  defaultValue: string;
  invalid: boolean;
  describedBy: string;
  disabled: boolean;
}) {
  const [date, setDate] = useState(defaultValue.split("T")[0] ?? "");
  const [time, setTime] = useState(defaultValue.split("T")[1] ?? "");
  const [open, setOpen] = useState(false);
  const parsed = date ? parseISO(date) : undefined;
  const selected = parsed && isValid(parsed) ? parsed : undefined;
  const label = name === "starts_at" ? "start" : "end";

  return (
    <>
      <input type="hidden" name={name} value={date || time ? `${date}T${time}` : ""} />
      <div className="datetime-fields">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={name}
              type="button"
              variant="outline"
              className="date-picker-trigger h-12 min-w-0 w-full justify-between rounded-[10px] bg-[#fcfdfa] px-3.5 font-normal shadow-none"
              data-empty={!selected}
              aria-required="true"
              aria-invalid={invalid}
              aria-describedby={describedBy}
              disabled={disabled}
            >
              <span className={selected ? "truncate" : "text-muted-foreground"}>
                {selected ? format(selected, "dd MMM yyyy") : "Pick a date"}
              </span>
              <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto rounded-xl p-0" align="start" side="bottom" sideOffset={8} collisionPadding={16} aria-label={`Choose ${label} date`}>
            <Calendar
              mode="single"
              captionLayout="dropdown"
              startMonth={new Date(1900, 0)}
              endMonth={new Date(2100, 11)}
              selected={selected}
              defaultMonth={selected}
              onSelect={(day) => {
                setDate(day ? format(day, "yyyy-MM-dd") : "");
                setOpen(false);
              }}
              className="[--cell-size:--spacing(9)]"
              autoFocus
            />
          </PopoverContent>
        </Popover>
        <input
          type="time"
          className="time-picker-input"
          step="60"
          value={time.slice(0, 5)}
          onChange={(event) => setTime(event.target.value.slice(0, 5))}
          aria-label={`${label === "start" ? "Start" : "End"} time`}
          aria-required="true"
          aria-invalid={invalid}
          aria-describedby={describedBy}
          disabled={disabled}
        />
      </div>
    </>
  );
}
