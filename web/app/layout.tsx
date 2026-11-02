import type { Metadata } from "next";
import { WorkspaceSidebar } from "@/components/workspace-sidebar";
import { WorkspaceIcon } from "@/components/workspace-icon";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Bookings · Caravan Workshop",
    template: "%s · Caravan Workshop",
  },
  description: "Manage caravan service appointments across four workshop bays.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-AU">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <WorkspaceSidebar />
        <div className="workspace-body">
          <header className="workspace-header">
            <div className="workspace-location">Workspace <span>/</span> <strong>Workshop</strong></div>
            <div className="workspace-pill"><WorkspaceIcon name="bookings" width="16" height="16" />Workshop bookings</div>
            <div className="desk-profile"><span className="desk-avatar">SD</span><span>Service desk</span></div>
          </header>
          <main id="main" className="main-content">{children}</main>
          <footer className="site-footer">
            <span>Made for the road ahead.</span>
            <span>All appointment times are Melbourne local time.</span>
          </footer>
        </div>
      </body>
    </html>
  );
}
