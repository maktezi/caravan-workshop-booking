import type { SVGProps } from "react";

export type IconName = "caravan" | "bookings" | "plus" | "clock" | "arrow" | "menu" | "close" | "check";

export function WorkspaceIcon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    caravan: <><path d="M3 17V7a2 2 0 0 1 2-2h10a3 3 0 0 1 3 3v9H3Zm15 0h3v-3M6 17h9" /><rect x="6" y="8" width="5" height="4" rx="1" /><path d="M14 17v-7h4" /><circle cx="7" cy="18" r="2" /></>,
    bookings: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4m10-4v4M3 11h18m-14 4h3m4 0h3m-10 3h3" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    arrow: <path d="m9 5 7 7-7 7" />,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    check: <path d="m5 12 4 4L19 6" />,
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
