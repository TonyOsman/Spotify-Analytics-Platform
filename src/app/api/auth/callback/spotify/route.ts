import { NextRequest, NextResponse } from "next/server";
import {
  CANONICAL_ORIGIN,
  encodeSession,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  SPOTIFY_REDIRECT_URI,
  type Session,
} from "@/lib/session";

const TOKEN_URL = "https://accounts.spotify.com/api/token";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${CANONICAL_ORIGIN}/login?error=${error}`);
  }

  if (!code) {
    return NextResponse.redirect(`${CANONICAL_ORIGIN}/login?error=NoCode`);
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;

  try {
    // Exchange code for tokens
    const tokenRes = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
      }),
    });

    const tokens = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error("Token error:", tokens);
      return NextResponse.redirect(`${CANONICAL_ORIGIN}/login?error=TokenError`);
    }

    // Get user profile
    const profileRes = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const profile = await profileRes.json();

    if (!profileRes.ok) {
      console.error("Profile error:", profile);
      return NextResponse.redirect(`${CANONICAL_ORIGIN}/login?error=ProfileError`);
    }

    // Log granted scopes for debugging
    console.log("Granted scopes:", tokens.scope);

    // Create session data
    const sessionData: Session = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
      scope: tokens.scope,
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.display_name,
        image: profile.images?.[0]?.url || null,
        isPremium: profile.product === "premium",
      },
    };

    const response = NextResponse.redirect(`${CANONICAL_ORIGIN}/dashboard`);
    response.cookies.set(
      SESSION_COOKIE,
      encodeSession(sessionData),
      SESSION_COOKIE_OPTIONS
    );

    return response;
  } catch (err) {
    console.error("OAuth error:", err);
    return NextResponse.redirect(`${CANONICAL_ORIGIN}/login?error=CallbackError`);
  }
}
