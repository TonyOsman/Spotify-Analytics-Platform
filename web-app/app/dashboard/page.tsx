"use client";

import { useEffect, useState } from "react";
import { edgeGet } from "../../lib/api";

export default function DashboardPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const payload = await edgeGet("/me/summary");
        setData(payload);
        setStatus("ok");
      } catch (e) {
        setError((e as Error).message);
        setStatus("error");
      }
    })();
  }, []);

  return (
    <>
      <div className="card">
        <h2>Dashboard</h2>
        <p className="helper">High-level profile and sync analytics from edge BFF.</p>
      </div>
      {status === "loading" && <div className="status loading">Loading summary...</div>}
      {status === "error" && <div className="status error">{error}</div>}
      {status === "ok" && data !== null && (
        <>
          <div className="grid">
            <div className="metric">
              <div className="metric-label">Top Tracks</div>
              <div className="metric-value">{String(data.topTrackCount ?? "0")}</div>
            </div>
            <div className="metric">
              <div className="metric-label">Playlists</div>
              <div className="metric-value">{String(data.playlistCount ?? "0")}</div>
            </div>
            <div className="metric">
              <div className="metric-label">Diversity Score</div>
              <div className="metric-value">{String(data.diversityScore ?? "0")}</div>
            </div>
          </div>
          <div className="card">
            <h3>Raw Payload</h3>
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        </>
      )}
      {status === "ok" && data === null && <div className="status empty">No data.</div>}
    </>
  );
}
