import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <div className="card">
        <h2>Spotify Analytics Platform</h2>
        <p className="helper">
          This interface is modeled after Spotify's console feel and optimized for local enterprise testing.
        </p>
      </div>
      <div className="grid">
        <div className="metric">
          <div className="metric-label">Get Started</div>
          <div className="metric-value"><Link href="/login">Open Login</Link></div>
        </div>
        <div className="metric">
          <div className="metric-label">Main View</div>
          <div className="metric-value"><Link href="/dashboard">Open Dashboard</Link></div>
        </div>
        <div className="metric">
          <div className="metric-label">Operations</div>
          <div className="metric-value"><Link href="/admin/jobs">Open Jobs</Link></div>
        </div>
      </div>
    </>
  );
}
