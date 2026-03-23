import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <div className="card">
            <div className="row">
              <Link href="/login">Login</Link>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/analytics">Analytics</Link>
              <Link href="/playlists">Playlists</Link>
              <Link href="/settings/integrations">Integrations</Link>
              <Link href="/admin/jobs">Admin Jobs</Link>
            </div>
          </div>
          {children}
        </div>
      </body>
    </html>
  );
}
