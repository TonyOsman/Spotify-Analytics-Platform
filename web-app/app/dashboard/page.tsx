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
    <div className="card">
      <h2>Dashboard</h2>
      {status === "loading" && <div className="status loading">Loading summary...</div>}
      {status === "error" && <div className="status error">{error}</div>}
      {status === "ok" && data !== null && <pre>{JSON.stringify(data, null, 2)}</pre>}
      {status === "ok" && data === null && <div className="status empty">No data.</div>}
    </div>
  );
}
