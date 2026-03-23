"use client";

import { useState } from "react";
import { edgeGet, edgePost } from "../../lib/api";

export default function LoginPage() {
  const [status, setStatus] = useState("Use dev login for local mode.");

  const devLogin = async () => {
    setStatus("Logging in...");
    try {
      await edgePost("/auth/session/dev-login", {
        userId: "demo-user",
        email: "demo.user@example.com",
        role: "ADMIN"
      });
      setStatus("Logged in.");
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  const oidcStart = async () => {
    setStatus("Starting OIDC...");
    try {
      const data = await edgeGet("/auth/session/login");
      if (data.authUrl) {
        window.location.href = data.authUrl as string;
      } else {
        setStatus(data.note ?? "OIDC unavailable");
      }
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  return (
    <div className="card">
      <h2>Login</h2>
      <p>Session auth is handled by edge-api secure cookies.</p>
      <div className="row">
        <button onClick={devLogin}>Dev Login</button>
        <button className="secondary" onClick={oidcStart}>
          OIDC Login
        </button>
      </div>
      <div className="status ok">{status}</div>
    </div>
  );
}
