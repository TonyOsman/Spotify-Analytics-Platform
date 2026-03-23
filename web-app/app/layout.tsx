import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <aside className="sidebar">
            <div className="brand">
              <span className="brand-dot" />
              Spotify Analytics
            </div>
            <nav className="nav-group">
              <Link className="nav-item" href="/login">Login</Link>
              <Link className="nav-item" href="/dashboard">Dashboard</Link>
              <Link className="nav-item" href="/analytics">Analytics</Link>
              <Link className="nav-item" href="/playlists">Playlists</Link>
              <Link className="nav-item" href="/settings/integrations">Integrations</Link>
              <Link className="nav-item" href="/admin/jobs">Admin Jobs</Link>
            </nav>
          </aside>
          <main className="main">
            <div className="topbar">
              <h1>Local Enterprise Console</h1>
              <span className="pill">v2 local-first</span>
            </div>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
