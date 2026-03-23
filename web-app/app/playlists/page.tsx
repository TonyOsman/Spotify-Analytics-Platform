"use client";

import { useEffect, useState } from "react";
import { edgeGet } from "../../lib/api";

export default function PlaylistsPage() {
  const [items, setItems] = useState<Record<string, unknown> | null>(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const payload = await edgeGet("/me/playlists");
        setItems(payload);
        setStatus("ok");
      } catch (e) {
        setError((e as Error).message);
        setStatus("error");
      }
    })();
  }, []);

  return (
    <div className="card">
      <h2>Playlists Overview</h2>
      <p className="helper">Playlist data synchronized from the last successful job.</p>
      {status === "loading" && <div className="status loading">Loading playlists...</div>}
      {status === "error" && <div className="status error">{error}</div>}
      {status === "ok" && items !== null && <pre>{JSON.stringify(items, null, 2)}</pre>}
      {status === "ok" && items === null && <div className="status empty">No playlists yet.</div>}
    </div>
  );
}
