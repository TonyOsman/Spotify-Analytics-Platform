import { redirect } from "next/navigation";
import Link from "next/link";
import { StatsView } from "./stats-view";
import { Player } from "@/components/Player";
import { PlaylistGenerator } from "@/components/PlaylistGenerator";
import { CANONICAL_ORIGIN, getSession } from "@/lib/session";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect(`${CANONICAL_ORIGIN}/login`);
  }

  return (
    <main className="dashboard">
      <nav className="dashboard-nav">
        <Link href="/" className="nav-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 18V5l12-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
          </svg>
          Statify
        </Link>
        <div className="nav-user">
          {session.user.image && (
            <img src={session.user.image} alt="" className="nav-avatar" />
          )}
          <span>{session.user.name}</span>
          <a href="/api/auth/logout" className="logout-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </a>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Your Music DNA</h1>
          <p>Discover insights about your listening habits</p>
        </div>

        <PlaylistGenerator />

        <StatsView />
      </div>

      <Player />
    </main>
  );
}
