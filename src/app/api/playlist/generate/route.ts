import { NextRequest, NextResponse } from "next/server";
import { createSpotifyClient } from "@/lib/spotify";
import { getValidSession } from "@/lib/session";

interface HistoryTrack {
  name: string;
  artist: string;
}

interface HistoryPlaylist {
  title: string;
  description: string;
  tracks: HistoryTrack[];
}

interface HistoryEntry {
  userPrompt: string;
  assistantResponse: HistoryPlaylist | null;
}

interface SpotifySearchTrack {
  id: string;
  uri: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  duration_ms: number;
}

function parsePlaylistJson(content: string) {
  const trimmed = content.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(withoutFence);
  } catch {
    const start = withoutFence.indexOf("{");
    const end = withoutFence.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
      throw new Error("AI response did not contain JSON");
    }

    return JSON.parse(withoutFence.slice(start, end + 1));
  }
}

export async function POST(request: NextRequest) {
  const session = await getValidSession();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "GROQ_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const { prompt, history = [] } = (await request.json()) as {
    prompt?: string;
    history?: HistoryEntry[];
  };
  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  try {
    const systemPrompt = `You are a music expert DJ. Based on the user's request, suggest or modify a playlist.

IMPORTANT: Always respond with ONLY a JSON object (no markdown, no code blocks, just raw JSON) with this exact structure:
{
  "title": "Creative playlist title",
  "description": "A brief description of the playlist vibe",
  "tracks": [
    {"query": "song name artist name"},
    {"query": "song name artist name"}
  ]
}

Include 10-15 tracks that match the vibe. For each track, provide a search query with the song name and artist name.
If the user asks to modify the playlist (add songs, remove songs, change vibe), update the playlist accordingly.
Only respond with the JSON, nothing else.`;

    const messages: { role: string; content: string }[] = [
      { role: "system", content: systemPrompt },
    ];

    if (history.length > 0) {
      for (const h of history) {
        messages.push({ role: "user", content: h.userPrompt });
        if (h.assistantResponse) {
          messages.push({ role: "assistant", content: JSON.stringify({
            title: h.assistantResponse.title,
            description: h.assistantResponse.description,
            tracks: h.assistantResponse.tracks.map((t) => ({ query: `${t.name} ${t.artist}` }))
          }) });
        }
      }
    }

    messages.push({ role: "user", content: prompt });

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!groqResponse.ok) {
      const errorBody = await groqResponse.text();
      throw new Error(`Groq API error: ${groqResponse.status} - ${errorBody}`);
    }

    const data = await groqResponse.json();
    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from Groq");
    }

    const playlist = parsePlaylistJson(content) as {
      title?: unknown;
      description?: unknown;
      tracks?: unknown;
    };

    if (
      typeof playlist.title !== "string" ||
      typeof playlist.description !== "string" ||
      !Array.isArray(playlist.tracks)
    ) {
      throw new Error("AI response had an invalid playlist shape");
    }

    // Search for each track on Spotify
    const spotify = createSpotifyClient(session.accessToken);
    const tracks = [];

    for (const track of playlist.tracks) {
      if (
        !track ||
        typeof track !== "object" ||
        typeof (track as { query?: unknown }).query !== "string"
      ) {
        continue;
      }

      try {
        const result = await spotify.searchTracks((track as { query: string }).query, 1) as {
          tracks?: { items?: SpotifySearchTrack[] };
        };
        const items = result.tracks?.items ?? [];
        if (items.length > 0) {
          const t = items[0];
          tracks.push({
            id: t.id,
            uri: t.uri,
            name: t.name,
            artist: t.artists.map((a) => a.name).join(", "),
            album: t.album.name,
            image: t.album.images[2]?.url || t.album.images[0]?.url,
            duration_ms: t.duration_ms,
          });
        }
      } catch {
        // Skip tracks that couldn't be found
      }
    }

    if (tracks.length === 0) {
      return NextResponse.json(
        { error: "No Spotify tracks matched the generated playlist" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      title: playlist.title,
      description: playlist.description,
      tracks,
    });
  } catch (error) {
    console.error("Playlist generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate playlist" },
      { status: 500 }
    );
  }
}
