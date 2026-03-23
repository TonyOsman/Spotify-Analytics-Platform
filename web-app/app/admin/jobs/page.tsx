"use client";

import { useState } from "react";
import { edgeGet, edgePost } from "../../../lib/api";

export default function AdminJobsPage() {
  const [status, setStatus] = useState("No sync running.");
  const [job, setJob] = useState<unknown>(null);

  const startSync = async () => {
    setStatus("Sync queued...");
    try {
      const response = await edgePost("/sync/spotify/start");
      setJob(response);
      setStatus("Sync job created.");
    } catch (e) {
      setStatus((e as Error).message);
    }
  };

  const readStatus = async () => {
    setStatus("Loading sync status...");
    try {
      const response = await edgeGet("/sync/spotify/status");
      setJob(response);
      setStatus("Sync status loaded.");
    } catch (e) {
      setStatus((e as Error).message);
    }
  };

  return (
    <div className="card">
      <h2>Admin Jobs</h2>
      <div className="row">
        <button onClick={startSync}>Start Spotify Sync</button>
        <button className="secondary" onClick={readStatus}>
          Refresh Status
        </button>
      </div>
      <div className="status ok">{status}</div>
      {job && <pre>{JSON.stringify(job, null, 2)}</pre>}
    </div>
  );
}
