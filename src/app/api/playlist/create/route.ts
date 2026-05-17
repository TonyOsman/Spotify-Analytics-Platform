import { NextRequest, NextResponse } from "next/server";
import { createSpotifyClient, SpotifyApiError } from "@/lib/spotify";
import { getValidSession } from "@/lib/session";

function cleanText(value: unknown, fallback: string, maxLength: number) {
  const text = typeof value === "string" ? value : fallback;
  const cleaned = text.replace(/\s+/g, " ").trim();
  return (cleaned || fallback).slice(0, maxLength);
}

export async function POST(request: NextRequest) {
  const session = await getValidSession();
  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Your Spotify session expired. Sign in again and use http://127.0.0.1:3000." },
      { status: 401 }
    );
  }

  const { title, description, trackUris } = await request.json();
  const safeTitle = cleanText(title, "Statify AI Playlist", 100);
  const safeDescription = cleanText(description, "Created with Statify AI", 300);
  const safeTrackUris = Array.isArray(trackUris)
    ? trackUris.filter((uri): uri is string => typeof uri === "string" && uri.startsWith("spotify:track:"))
    : [];

  if (!safeTitle || safeTrackUris.length === 0) {
    return NextResponse.json(
      { error: "Title and tracks are required" },
      { status: 400 }
    );
  }

  try {
    const grantedScopes = new Set((session.scope || "").split(/\s+/).filter(Boolean));
    const canCreatePrivate = grantedScopes.has("playlist-modify-private");
    const canCreatePublic = grantedScopes.has("playlist-modify-public");

    if (!canCreatePrivate && !canCreatePublic) {
      return NextResponse.json(
        { error: "Spotify did not grant playlist creation permission. Log out, sign in again, and approve the playlist permissions." },
        { status: 403 }
      );
    }

    const spotify = createSpotifyClient(session.accessToken);
    const currentUser = await spotify.getMe();
    const userIds = Array.from(new Set([currentUser.id, session.user.id].filter(Boolean)));
    const visibilities = canCreatePrivate
      ? [false, ...(canCreatePublic ? [true] : [])]
      : [true];
    const attempts: Array<{
      userId: string;
      public: boolean;
      status: number;
      data: unknown;
      headers: Record<string, string>;
    }> = [];

    let playlist;

    for (const userId of userIds) {
      for (const isPublic of visibilities) {
        try {
          playlist = await spotify.createPlaylist(
            userId,
            safeTitle,
            safeDescription,
            isPublic
          );
          break;
        } catch (error) {
          if (!(error instanceof SpotifyApiError)) {
            throw error;
          }

          attempts.push({
            userId,
            public: isPublic,
            status: error.status,
            data: error.data,
            headers: error.headers,
          });

          if (error.status !== 403) {
            throw error;
          }
        }
      }

      if (playlist) {
        break;
      }
    }

    if (!playlist) {
      return NextResponse.json(
        {
          error: "Spotify rejected playlist creation even though the token has playlist scopes.",
          details: {
            signedInAs: {
              id: currentUser.id,
              email: currentUser.email,
              displayName: currentUser.display_name,
              product: currentUser.product,
            },
            sessionUser: {
              id: session.user.id,
              email: session.user.email,
              name: session.user.name,
            },
            clientId: process.env.SPOTIFY_CLIENT_ID,
            scopes: session.scope,
            attempts,
          },
        },
        { status: 403 }
      );
    }

    await spotify.addTracksToPlaylist(playlist.id, safeTrackUris);

    return NextResponse.json({
      success: true,
      playlistId: playlist.id,
      playlistUrl: playlist.external_urls.spotify,
    });
  } catch (error) {
    const message =
      error instanceof SpotifyApiError && error.status === 403
        ? "Spotify rejected playlist creation for this account. Log out, sign in again at http://127.0.0.1:3000, and approve playlist permissions. If it still fails, add this Spotify account as a user in the Spotify Developer Dashboard for this app."
        : error instanceof Error
          ? error.message
          : "Failed to create playlist";
    const status = error instanceof SpotifyApiError ? error.status : 500;
    console.error("Playlist creation error:", message);
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
