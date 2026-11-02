"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { WorkspaceIcon } from "@/components/workspace-icon";

export function WorkspaceSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const creating = pathname === "/bookings/new";
  return (
    <aside className="workspace-sidebar">
      <div className="sidebar-brand-row">
        <Link href="/bookings" className="brand" aria-label="Caravan Workshop home" onClick={() => setOpen(false)}>
          <span className="brand-mark"><WorkspaceIcon name="caravan" width="25" height="25" /></span>
          <span>Caravan<strong>Workshop</strong></span>
        </Link>
        <button className="mobile-menu" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="workspace-navigation" onClick={() => setOpen(!open)}>
          <WorkspaceIcon name={open ? "close" : "menu"} />
        </button>
      </div>
      <div className={`sidebar-content${open ? " is-open" : ""}`} id="workspace-navigation">
        <nav className="workspace-nav" aria-label="Main navigation">
          <Link href="/bookings" aria-current={!creating ? "page" : undefined} onClick={() => setOpen(false)}><WorkspaceIcon name="bookings" />Bookings</Link>
          <Link href="/bookings/new" aria-current={creating ? "page" : undefined} onClick={() => setOpen(false)}><WorkspaceIcon name="plus" />New booking</Link>
        </nav>
        <div className="sidebar-section">
          <p className="sidebar-label">Booking status</p>
          <nav className="status-navigation" aria-label="Browse by status">
            {(["pending", "confirmed", "cancelled"] as const).map((status) => (
              <Link key={status} href={`/bookings?status=${status}`} onClick={() => setOpen(false)}><span className={`nav-dot nav-dot-${status}`} />{status[0].toUpperCase() + status.slice(1)}<WorkspaceIcon name="arrow" width="14" height="14" /></Link>
            ))}
          </nav>
        </div>
        <div className="sidebar-bottom"><WorkspaceIcon name="clock" /><div>Melbourne local time<span>Australia/Melbourne</span></div></div>
      </div>
    </aside>
  );
}
