import crypto from "node:crypto";
import Fastify from "fastify";
import axios from "axios";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

const app = Fastify({ logger: true });
const port = Number(process.env.PORT ?? "3000");
const coreBaseUrl = process.env.CORE_API_URL ?? "http://localhost:8080";

const pkceMemory = new Map<string, string>();

await app.register(swagger, {
  openapi: {
    info: {
      title: "Edge API",
      version: "0.0.1",
      description: "Spotify analytics edge/BFF service"
    }
  }
});

await app.register(swaggerUi, {
  routePrefix: "/docs"
});

app.get("/auth/spotify/login", async (request) => {
  const state = crypto.randomUUID();
  const verifier = crypto.randomBytes(32).toString("hex");
  pkceMemory.set(state, verifier);
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");

  const redirectUri = process.env.SPOTIFY_REDIRECT_URI ?? "http://localhost:3000/auth/spotify/callback";
  const clientId = process.env.SPOTIFY_CLIENT_ID ?? "replace-me";
  const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=user-top-read%20playlist-read-private&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&code_challenge_method=S256&code_challenge=${challenge}`;

  return { authUrl, state };
});

app.get("/auth/spotify/callback", async (request) => {
  const query = request.query as { code?: string; state?: string; userId?: string };
  if (!query.state || !pkceMemory.has(query.state)) {
    return { status: "error", message: "Invalid OAuth state" };
  }
  pkceMemory.delete(query.state);
  const userId = query.userId ?? "demo-user";

  await axios.post(`${coreBaseUrl}/ingest/spotify/profile`, {
    userId,
    displayName: "Demo Student",
    country: "BR"
  });

  return { status: "ok", userId, note: "Spotify token exchange placeholder wired to ingestion flow." };
});

app.post("/auth/logout", async () => {
  return {};
});

app.get("/me/summary", async (request) => {
  const query = request.query as { userId?: string };
  const userId = query.userId ?? "demo-user";
  const response = await axios.get(`${coreBaseUrl}/internal/users/${userId}/summary`);
  return response.data;
});

app.get("/me/top", async (request) => {
  const query = request.query as { userId?: string; range?: string; type?: string };
  const userId = query.userId ?? "demo-user";
  const response = await axios.get(`${coreBaseUrl}/internal/users/${userId}/top`);
  return { range: query.range ?? "medium", type: query.type ?? "tracks", items: response.data };
});

app.get("/me/playlists", async (request) => {
  const query = request.query as { userId?: string };
  const userId = query.userId ?? "demo-user";
  const response = await axios.get(`${coreBaseUrl}/internal/users/${userId}/playlists`);
  return response.data;
});

app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
