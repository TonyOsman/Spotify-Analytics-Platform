"use client";

import { useState } from "react";

interface Track {
  id: string;
  uri: string;
  name: string;
  artist: string;
  album: string;
  image: string;
  duration_ms: number;
}

interface GeneratedPlaylist {
  title: string;
  description: string;
  tracks: Track[];
}

interface HistoryEntry {
  userPrompt: string;
  assistantResponse: GeneratedPlaylist | null;
}

interface PlaylistCreateErrorDetails {
  signedInAs?: {
    id?: string;
    email?: string;
    displayName?: string;
  };
  clientId?: string;
  scopes?: string;
}

function formatCreateError(data: { error?: string; details?: PlaylistCreateErrorDetails } | null) {
  if (!data?.details) {
    return data?.error || "Failed to create playlist";
  }

  const signedIn = data.details.signedInAs;
  const account = signedIn?.email || signedIn?.id || signedIn?.displayName || "unknown Spotify account";
  const clientId = data.details.clientId || "unknown client id";

  return `${data.error || "Spotify rejected playlist creation"} Signed in as ${account}. Check Spotify Developer Dashboard user management for client ID ${clientId}.`;
}

export function PlaylistGenerator() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [playlist, setPlaylist] = useState<GeneratedPlaylist | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    const currentPrompt = prompt;
    setPrompt("");

    try {
      const res = await fetch("/api/playlist/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: currentPrompt, history }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to generate playlist");
      }

      const data = await res.json();
      setPlaylist(data);
      setHistory([...history, { userPrompt: currentPrompt, assistantResponse: data }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate playlist. Please try again.");
      setPrompt(currentPrompt);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!playlist || creating) return;

    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/playlist/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: playlist.title,
          description: playlist.description,
          trackUris: playlist.tracks.map((t) => t.uri),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(formatCreateError(data));
      }

      const data = await res.json();
      setSuccess(data.playlistUrl);
      setPlaylist(null);
      setPrompt("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create playlist. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  function handleCancel() {
    setPlaylist(null);
    setError(null);
    setHistory([]);
    setPrompt("");
  }

  function formatDuration(ms: number) {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  return (
    <div className="playlist-generator">
      <form onSubmit={handleGenerate} className="generator-form">
        <div className="generator-input-wrapper">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={playlist ? "Refine your playlist... (e.g., 'add more upbeat songs' or 'remove the rock songs')" : "Describe your playlist vibe... (e.g., 'chill lo-fi beats for studying' or 'songs like Blinding Lights')"}
            className="generator-input"
            disabled={loading}
          />
          <button
            type="submit"
            className="generator-btn"
            disabled={!prompt.trim() || loading}
          >
            {loading ? (
              <div className="btn-spinner"></div>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            )}
          </button>
        </div>
      </form>

      {error && <div className="error-box">{error}</div>}

      {success && (
        <div className="success-box">
          Playlist created!{" "}
          <a href={success} target="_blank" rel="noopener noreferrer">
            Open in Spotify
          </a>
        </div>
      )}

      {playlist && (
        <div className="playlist-preview">
          <div className="playlist-header">
            <div className="playlist-info">
              <h3>{playlist.title}</h3>
              <p>{playlist.description}</p>
              <span className="playlist-count">{playlist.tracks.length} tracks</span>
            </div>
            <div className="playlist-actions">
              <button className="btn-cancel" onClick={handleCancel}>
                Cancel
              </button>
              <button
                className="btn-create"
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? "Creating..." : "Add to Spotify"}
              </button>
            </div>
          </div>

          <div className="playlist-tracks">
            {playlist.tracks.map((track, i) => (
              <div key={`${track.id}-${i}`} className="playlist-track">
                <span className="track-num">{i + 1}</span>
                <img src={track.image} alt="" className="track-thumb" />
                <div className="track-details">
                  <span className="track-title">{track.name}</span>
                  <span className="track-meta">{track.artist}</span>
                </div>
                <span className="track-len">{formatDuration(track.duration_ms)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
