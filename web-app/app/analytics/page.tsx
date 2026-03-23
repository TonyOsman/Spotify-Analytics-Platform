"use client";

import { useEffect, useState } from "react";
import { edgeGet } from "../../lib/api";

export default function AnalyticsPage() {
  const [top, setTop] = useState<unknown>(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const payload = await edgeGet("/me/top?range=medium&type=tracks");
        setTop(payload);
        setStatus("ok");
      } catch (e) {
        setStatus("error");
        setError((e as Error).message);
      }
    })();
  }, []);

  return (
    <div className="card">
      <h2>Analytics</h2>
      {status === "loading" && <div className="status loading">Loading analytics...</div>}
      {status === "error" && <div className="status error">{error}</div>}
      {status === "ok" && top && <pre>{JSON.stringify(top, null, 2)}</pre>}
      {status === "ok" && !top && <div className="status empty">No analytics yet.</div>}
    </div>
  );
}
