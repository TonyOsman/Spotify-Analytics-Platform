import { cookies } from "next/headers";

const DEFAULT_ORIGIN = "http://127.0.0.1:3000";

function normalizeOrigin(origin: string | undefined) {
  if (!origin) return DEFAULT_ORIGIN;

  try {
    return new URL(origin).origin;
  } catch {
    return DEFAULT_ORIGIN;
  }
}

export const CANONICAL_ORIGIN = normalizeOrigin(process.env.AUTH_URL);
export const SPOTIFY_REDIRECT_URI = `${CANONICAL_ORIGIN}/api/auth/callback/spotify`;
export const SESSION_COOKIE = "statify-session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export const SESSION_COOKIE_OPTIONS = {
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
  maxAge: SESSION_MAX_AGE,
};

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope?: string;
  user: {
    id: string;
    email: string;
    name: string;
    image: string | null;
    isPremium: boolean;
  };
}

export function encodeSession(session: Session) {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

export function decodeSession(value: string): Session | null {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Session;
  } catch {
    try {
      return JSON.parse(decodeURIComponent(value)) as Session;
    } catch {
      return null;
    }
  }
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);

  if (!sessionCookie?.value) {
    return null;
  }

  return decodeSession(sessionCookie.value);
}

async function refreshSession(session: Session): Promise<Session> {
  if (!session.refreshToken) {
    throw new Error("Missing Spotify refresh token");
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Spotify credentials are not configured");
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: session.refreshToken,
    }),
  });

  const tokens = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `Failed to refresh Spotify token: ${response.status} - ${JSON.stringify(tokens)}`
    );
  }

  return {
    ...session,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || session.refreshToken,
    expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
    scope: tokens.scope || session.scope,
  };
}

export async function getValidSession(): Promise<Session | null> {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const expiresSoon = session.expiresAt <= Math.floor(Date.now() / 1000) + 60;
  if (!expiresSoon) {
    return session;
  }

  const cookieStore = await cookies();

  try {
    const refreshedSession = await refreshSession(session);
    cookieStore.set(
      SESSION_COOKIE,
      encodeSession(refreshedSession),
      SESSION_COOKIE_OPTIONS
    );
    return refreshedSession;
  } catch (error) {
    console.error("Session refresh error:", error);
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
