import Link from "next/link";

export default function HomePage() {
  return (
    <div className="card">
      <h1>Spotify Analytics Platform</h1>
      <p>Local-first enterprise v2 workspace.</p>
      <p>
        Start at <Link href="/login">/login</Link>.
      </p>
    </div>
  );
}
