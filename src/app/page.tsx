import Link from "next/link";
import { CANONICAL_ORIGIN } from "@/lib/session";

export default function Home() {
  return (
    <main className="landing">
      <div className="landing-left">
        <div className="landing-logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
          </svg>
          Statify
        </div>

        <div className="landing-badge">
          <span></span>
          AI-Powered Analytics
        </div>

        <h1 className="landing-title">
          Decode your<br />
          <span className="highlight">music DNA.</span>
        </h1>

        <p className="landing-desc">
          Deep-dive into your Spotify listening patterns. Track your music evolution,
          control playback, and let AI generate playlists tailored to your unique taste.
        </p>

        <div className="landing-cta">
          <a href={`${CANONICAL_ORIGIN}/login`} className="btn btn-primary">
            Connect Spotify
          </a>
          <Link href="#features" className="btn btn-ghost">
            See how it works
          </Link>
        </div>

        <div className="landing-stats">
          <div className="stat">
            <span className="stat-value">30+</span>
            <span className="stat-label">Tracks analyzed</span>
          </div>
          <div className="stat">
            <span className="stat-value">3</span>
            <span className="stat-label">Time ranges</span>
          </div>
          <div className="stat">
            <span className="stat-value">AI</span>
            <span className="stat-label">DJ Generation</span>
          </div>
        </div>
      </div>

      <div className="landing-right">
        <div className="glow-orb"></div>
        <div className="vinyl-container">
          <div className="vinyl"></div>
        </div>
      </div>
    </main>
  );
}
