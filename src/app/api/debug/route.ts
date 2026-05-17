import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CANONICAL_ORIGIN, getValidSession, SESSION_COOKIE } from "@/lib/session";

export async function GET() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);

  const session = await getValidSession();

  if (!session?.accessToken) {
    return NextResponse.json({
      error: "No session",
      canonicalOrigin: CANONICAL_ORIGIN,
      cookieNames: allCookies.map(c => c.name),
      hasSessionCookie: !!sessionCookie,
      sessionCookieLength: sessionCookie?.value?.length || 0,
    }, { status: 401 });
  }

  // Test the token by getting user info
  const userRes = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });

  const userData = await userRes.json();

  return NextResponse.json({
    tokenPresent: !!session.accessToken,
    tokenLength: session.accessToken?.length,
    user: userData,
    scopes: session.scope || "not stored in session",
  });
}
