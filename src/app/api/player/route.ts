import { NextRequest, NextResponse } from "next/server";
import { createSpotifyClient } from "@/lib/spotify";
import { getValidSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await getValidSession();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");

  try {
    const spotify = createSpotifyClient(session.accessToken);

    if (type === "devices") {
      const devices = await spotify.getDevices();
      return NextResponse.json(devices);
    }

    const playback = await spotify.getPlaybackState();
    return NextResponse.json(playback);
  } catch (error) {
    console.error("Playback state error:", error);
    return NextResponse.json({ error: "Failed to get playback" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getValidSession();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, uri, volume, deviceId, position } = await request.json();
  const spotify = createSpotifyClient(session.accessToken);

  try {
    switch (action) {
      case "play":
        await spotify.play(uri);
        break;
      case "pause":
        await spotify.pause();
        break;
      case "next":
        await spotify.next();
        break;
      case "previous":
        await spotify.previous();
        break;
      case "volume":
        await spotify.setVolume(volume);
        break;
      case "transfer":
        await spotify.transferPlayback(deviceId);
        break;
      case "seek":
        await spotify.seek(position);
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Playback control error:", error);
    return NextResponse.json({ error: "Playback control failed" }, { status: 500 });
  }
}
