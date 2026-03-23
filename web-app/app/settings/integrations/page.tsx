"use client";

import { useState } from "react";
import { edgeGet, edgePost } from "../../../lib/api";

export default function IntegrationsPage() {
  const [status, setStatus] = useState("Not connected.");

  const connect = async () => {
    setStatus("Preparing Spotify connect...");
    try {
      const response = await edgeGet("/integrations/spotify/connect");
      if (response.authUrl) {
        window.location.href = response.authUrl as string;
        return;
      }
      setStatus("Connect URL unavailable.");
    } catch (e) {
      setStatus((e as Error).message);
    }
  };

  const disconnect = async () => {
    setStatus("Disconnecting...");
    try {
      await edgePost("/integrations/spotify/disconnect");
      setStatus("Spotify disconnected.");
    } catch (e) {
      setStatus((e as Error).message);
    }
  };

  return (
    <div className="card">
      <h2>Integrations</h2>
      <p className="helper">Manage Spotify connection and token lifecycle via edge-api.</p>
      <div className="row">
        <button onClick={connect}>Connect Spotify Account</button>
        <button className="secondary" onClick={disconnect}>
          Disconnect Account
        </button>
      </div>
      <div className="status ok">{status}</div>
    </div>
  );
}
