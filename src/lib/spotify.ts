const SPOTIFY_API = "https://api.spotify.com/v1";

export class SpotifyApiError extends Error {
  status: number;
  data: unknown;
  headers: Record<string, string>;

  constructor(operation: string, res: Response, data: unknown) {
    super(`${operation}: ${res.status} - ${JSON.stringify(data)}`);
    this.name = "SpotifyApiError";
    this.status = res.status;
    this.data = data;
    this.headers = {
      "www-authenticate": res.headers.get("www-authenticate") || "",
      "retry-after": res.headers.get("retry-after") || "",
      "x-spotify-trace-id": res.headers.get("x-spotify-trace-id") || "",
      "spotify-trace-id": res.headers.get("spotify-trace-id") || "",
    };
  }
}

async function throwSpotifyError(res: Response, operation: string): Promise<never> {
  const data = await res.json().catch(() => null);
  throw new SpotifyApiError(operation, res, data);
}

export function createSpotifyClient(accessToken: string) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
  };

  return {
    async getTopTracks(timeRange: string = "medium_term", limit: number = 20) {
      const res = await fetch(
        `${SPOTIFY_API}/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
        { headers, cache: "no-store" }
      );
      if (!res.ok) await throwSpotifyError(res, "Failed to fetch top tracks");
      return res.json();
    },

    async getTopArtists(timeRange: string = "medium_term", limit: number = 20) {
      const res = await fetch(
        `${SPOTIFY_API}/me/top/artists?time_range=${timeRange}&limit=${limit}`,
        { headers, cache: "no-store" }
      );
      if (!res.ok) await throwSpotifyError(res, "Failed to fetch top artists");
      return res.json();
    },

    async getRecentlyPlayed(limit: number = 20) {
      const res = await fetch(
        `${SPOTIFY_API}/me/player/recently-played?limit=${limit}`,
        { headers, cache: "no-store" }
      );
      if (!res.ok) await throwSpotifyError(res, "Failed to fetch recently played");
      return res.json();
    },

    async getPlaybackState() {
      const res = await fetch(`${SPOTIFY_API}/me/player`, { headers, cache: "no-store" });
      if (res.status === 204) return null;
      if (!res.ok) await throwSpotifyError(res, "Failed to get playback state");
      return res.json();
    },

    async play(uri?: string) {
      const body = uri
        ? JSON.stringify(uri.includes("track") ? { uris: [uri] } : { context_uri: uri })
        : undefined;
      const res = await fetch(`${SPOTIFY_API}/me/player/play`, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body,
      });
      if (!res.ok && res.status !== 204) await throwSpotifyError(res, "Failed to play");
    },

    async pause() {
      const res = await fetch(`${SPOTIFY_API}/me/player/pause`, {
        method: "PUT",
        headers,
      });
      if (!res.ok && res.status !== 204) await throwSpotifyError(res, "Failed to pause");
    },

    async next() {
      const res = await fetch(`${SPOTIFY_API}/me/player/next`, {
        method: "POST",
        headers,
      });
      if (!res.ok && res.status !== 204) await throwSpotifyError(res, "Failed to skip");
    },

    async previous() {
      const res = await fetch(`${SPOTIFY_API}/me/player/previous`, {
        method: "POST",
        headers,
      });
      if (!res.ok && res.status !== 204) await throwSpotifyError(res, "Failed to go back");
    },

    async setVolume(percent: number) {
      const res = await fetch(`${SPOTIFY_API}/me/player/volume?volume_percent=${percent}`, {
        method: "PUT",
        headers,
      });
      if (!res.ok && res.status !== 204) await throwSpotifyError(res, "Failed to set volume");
    },

    async getDevices() {
      const res = await fetch(`${SPOTIFY_API}/me/player/devices`, { headers, cache: "no-store" });
      if (!res.ok) await throwSpotifyError(res, "Failed to get devices");
      return res.json();
    },

    async transferPlayback(deviceId: string) {
      const res = await fetch(`${SPOTIFY_API}/me/player`, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ device_ids: [deviceId], play: true }),
      });
      if (!res.ok && res.status !== 204) await throwSpotifyError(res, "Failed to transfer playback");
    },

    async seek(positionMs: number) {
      const res = await fetch(`${SPOTIFY_API}/me/player/seek?position_ms=${positionMs}`, {
        method: "PUT",
        headers,
      });
      if (!res.ok && res.status !== 204) await throwSpotifyError(res, "Failed to seek");
    },

    async searchTracks(query: string, limit: number = 10) {
      const res = await fetch(
        `${SPOTIFY_API}/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
        { headers, cache: "no-store" }
      );
      if (!res.ok) await throwSpotifyError(res, "Failed to search tracks");
      return res.json();
    },

    async createPlaylist(userId: string, name: string, description: string, isPublic = false) {
      const res = await fetch(`${SPOTIFY_API}/users/${encodeURIComponent(userId)}/playlists`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          public: isPublic,
          collaborative: false,
        }),
      });
      if (!res.ok) {
        await throwSpotifyError(res, "Failed to create playlist");
      }
      return res.json();
    },

    async addTracksToPlaylist(playlistId: string, uris: string[]) {
      const res = await fetch(`${SPOTIFY_API}/playlists/${playlistId}/tracks`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ uris }),
      });
      if (!res.ok) {
        await throwSpotifyError(res, "Failed to add tracks");
      }
      return res.json();
    },

    async getMe() {
      const res = await fetch(`${SPOTIFY_API}/me`, { headers, cache: "no-store" });
      if (!res.ok) {
        await throwSpotifyError(res, "Failed to get user");
      }
      return res.json();
    },
  };
}
