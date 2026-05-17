import { NextRequest, NextResponse } from "next/server";
import { createSpotifyClient } from "@/lib/spotify";
import { getValidSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await getValidSession();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const timeRange = searchParams.get("timeRange") || "medium_term";

  try {
    const spotify = createSpotifyClient(session.accessToken);

    const [topTracks, topArtists] = await Promise.all([
      spotify.getTopTracks(timeRange, 10),
      spotify.getTopArtists(timeRange, 10),
    ]);

    let recentlyPlayed = { items: [] };
    try {
      recentlyPlayed = await spotify.getRecentlyPlayed(20);
    } catch (e) {
      console.error("Recently played error:", e);
    }

    return NextResponse.json({
      topTracks: topTracks.items,
      topArtists: topArtists.items,
      recentlyPlayed: recentlyPlayed.items || [],
      timeRange,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
