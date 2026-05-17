import { NextResponse } from "next/server";
import { SPOTIFY_REDIRECT_URI } from "@/lib/session";

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";

const SCOPES = [
  "user-read-email",
  "user-read-private",
  "user-top-read",
  "user-read-recently-played",
  "user-library-read",
  "playlist-read-private",
  "playlist-modify-public",
  "playlist-modify-private",
  "streaming",
  "user-read-playback-state",
  "user-modify-playback-state",
].join(" ");

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: "SPOTIFY_CLIENT_ID not configured" },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: SPOTIFY_REDIRECT_URI,
    scope: SCOPES,
    show_dialog: "true",
  });

  return NextResponse.redirect(`${SPOTIFY_AUTH_URL}?${params}`);
}
