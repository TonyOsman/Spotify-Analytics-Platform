import crypto from "node:crypto";
import Fastify, { FastifyInstance } from "fastify";
import axios from "axios";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import jwt from "jsonwebtoken";

type SessionPayload = {
  userId: string;
  email: string;
  role: "USER" | "ADMIN";
};

type OidcState = {
  state: string;
  nonce: string;
};

const spotifyPkceMemory = new Map<string, { verifier: string; userId: string }>();
const oidcStateMemory = new Map<string, OidcState>();

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });
  const coreBaseUrl = process.env.CORE_API_URL ?? "http://localhost:8080";
  const sessionSecret = process.env.SESSION_SECRET ?? "local-dev-session-secret";

  await app.register(cors, {
    origin: true,
    credentials: true
  });
  await app.register(cookie, { secret: sessionSecret });
  await app.register(swagger, {
    openapi: {
      info: {
        title: "Edge API",
        version: "2.0.0",
        description: "Spotify analytics edge/BFF service"
      }
    }
  });
  await app.register(swaggerUi, { routePrefix: "/docs" });

  const signSession = (payload: SessionPayload) => jwt.sign(payload, sessionSecret, { expiresIn: "12h" });
  const readSession = (token?: string): SessionPayload | null => {
    if (!token) {
      return null;
    }
    try {
      return jwt.verify(token, sessionSecret) as SessionPayload;
    } catch {
      return null;
    }
  };

  const startSessionLogin = async () => {
    const issuer = process.env.OIDC_ISSUER;
    const clientId = process.env.OIDC_CLIENT_ID;
    const redirectUri = process.env.OIDC_REDIRECT_URI ?? "http://localhost:3000/auth/session/callback";
    if (!issuer || !clientId) {
      return { mode: "local", note: "OIDC not configured; use /auth/session/dev-login for local development." };
    }
    const state = crypto.randomUUID();
    const nonce = crypto.randomUUID();
    oidcStateMemory.set(state, { state, nonce });
    const authUrl = `${issuer}/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20email&state=${state}&nonce=${nonce}`;
    return { mode: "oidc", authUrl, state };
  };
  app.get("/auth/session/login", startSessionLogin);
  app.post("/auth/session/login", startSessionLogin);

  app.get("/auth/session/callback", async (request, reply) => {
    const query = request.query as { code?: string; state?: string; email?: string; userId?: string };
    if (!query.state || !oidcStateMemory.has(query.state)) {
      return reply.code(400).send({ status: "error", message: "Invalid auth state." });
    }
    oidcStateMemory.delete(query.state);

    const userId = query.userId ?? "demo-user";
    const email = query.email ?? "demo.user@example.com";
    const session = signSession({ userId, email, role: "USER" });
    reply.setCookie("app_session", session, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/"
    });

    try {
      await axios.post(`${coreBaseUrl}/ingest/spotify/profile`, {
        userId,
        displayName: "Demo User",
        country: "BR"
      });
    } catch {
      app.log.warn("core-api unreachable during session callback profile upsert");
    }
    return { status: "ok", userId, email };
  });

  app.post("/auth/session/dev-login", async (request, reply) => {
    const body = request.body as { userId?: string; email?: string; role?: "USER" | "ADMIN" };
    const userId = body?.userId ?? "demo-user";
    const email = body?.email ?? "demo.user@example.com";
    const role = body?.role ?? "USER";
    const session = signSession({ userId, email, role });
    reply.setCookie("app_session", session, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/"
    });
    try {
      await axios.post(`${coreBaseUrl}/ingest/spotify/profile`, {
        userId,
        displayName: "Demo User",
        country: "BR"
      });
    } catch {
      app.log.warn("core-api unreachable during dev login profile upsert");
    }
    return { status: "ok", userId, email, role };
  });

  app.post("/auth/session/logout", async (request, reply) => {
    reply.clearCookie("app_session", { path: "/" });
    return { status: "ok" };
  });

  app.post("/auth/logout", async (request, reply) => {
    reply.clearCookie("app_session", { path: "/" });
    return { status: "ok" };
  });

  app.get("/auth/session/me", async (request, reply) => {
    const session = readSession(request.cookies.app_session);
    if (!session) {
      return reply.code(401).send({ status: "error", message: "Not authenticated" });
    }
    return session;
  });

  const connectSpotify = async (request: any, reply: any) => {
    const session = readSession(request.cookies.app_session);
    if (!session) {
      return reply.code(401).send({ status: "error", message: "Not authenticated" });
    }
    const state = crypto.randomUUID();
    const verifier = crypto.randomBytes(32).toString("hex");
    spotifyPkceMemory.set(state, { verifier, userId: session.userId });
    const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");

    const redirectUri = process.env.SPOTIFY_REDIRECT_URI ?? "http://localhost:3000/auth/spotify/callback";
    const clientId = process.env.SPOTIFY_CLIENT_ID ?? "replace-me";
    const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=user-top-read%20playlist-read-private&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&code_challenge_method=S256&code_challenge=${challenge}`;
    return { authUrl, state };
  };
  app.get("/integrations/spotify/connect", connectSpotify);
  app.post("/integrations/spotify/connect", connectSpotify);
  app.get("/auth/spotify/login", connectSpotify);

  app.get("/auth/spotify/callback", async (request, reply) => {
    const query = request.query as { code?: string; state?: string };
    if (!query.state || !spotifyPkceMemory.has(query.state)) {
      return reply.code(400).send({ status: "error", message: "Invalid OAuth state" });
    }
    const payload = spotifyPkceMemory.get(query.state)!;
    spotifyPkceMemory.delete(query.state);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 3600 * 1000);
    await axios.post(`${coreBaseUrl}/tokens/spotify`, {
      userId: payload.userId,
      accessToken: `local-access-${payload.userId}`,
      refreshToken: `local-refresh-${payload.userId}`,
      expiresAt: expiresAt.toISOString()
    });

    return {
      status: "ok",
      userId: payload.userId,
      note: "Spotify token exchange uses local placeholder tokens in v2 local mode."
    };
  });

  app.post("/integrations/spotify/disconnect", async (request, reply) => {
    const session = readSession(request.cookies.app_session);
    if (!session) {
      return reply.code(401).send({ status: "error", message: "Not authenticated" });
    }
    await axios.delete(`${coreBaseUrl}/tokens/spotify/${session.userId}`);
    return { status: "ok" };
  });

  app.post("/sync/spotify/start", async (request, reply) => {
    const session = readSession(request.cookies.app_session);
    if (!session) {
      return reply.code(401).send({ status: "error", message: "Not authenticated" });
    }
    const response = await axios.post(`${coreBaseUrl}/jobs/spotify/sync`, { userId: session.userId });
    return response.data;
  });

  app.get("/sync/spotify/status", async (request, reply) => {
    const session = readSession(request.cookies.app_session);
    if (!session) {
      return reply.code(401).send({ status: "error", message: "Not authenticated" });
    }
    const response = await axios.get(`${coreBaseUrl}/users/${session.userId}/sync-state`);
    return response.data;
  });

  app.get("/me/summary", async (request, reply) => {
    const session = readSession(request.cookies.app_session);
    if (!session) {
      return reply.code(401).send({ status: "error", message: "Not authenticated" });
    }
    const response = await axios.get(`${coreBaseUrl}/internal/users/${session.userId}/summary`);
    return response.data;
  });

  app.get("/me/top", async (request, reply) => {
    const session = readSession(request.cookies.app_session);
    if (!session) {
      return reply.code(401).send({ status: "error", message: "Not authenticated" });
    }
    const query = request.query as { range?: string; type?: string };
    const response = await axios.get(`${coreBaseUrl}/internal/users/${session.userId}/top`);
    return { range: query.range ?? "medium", type: query.type ?? "tracks", items: response.data };
  });

  app.get("/me/playlists", async (request, reply) => {
    const session = readSession(request.cookies.app_session);
    if (!session) {
      return reply.code(401).send({ status: "error", message: "Not authenticated" });
    }
    const response = await axios.get(`${coreBaseUrl}/internal/users/${session.userId}/playlists`);
    return response.data;
  });

  return app;
}
