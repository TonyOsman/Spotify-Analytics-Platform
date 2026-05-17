"use client";

import { useState, useEffect } from "react";

type TimeRange = "short_term" | "medium_term" | "long_term";

interface Track {
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

interface Artist {
  id: string;
  uri: string;
  name: string;
  images: { url: string }[];
}

interface RecentItem {
  track: Track;
  played_at: string;
}

interface Stats {
  topTracks: Track[];
  topArtists: Artist[];
  recentlyPlayed: RecentItem[];
  timeRange: string;
}

const TIME_LABELS: Record<TimeRange, string> = {
  short_term: "Last 4 Weeks",
  medium_term: "Last 6 Months",
  long_term: "All Time",
};

export function StatsView() {
  const [timeRange, setTimeRange] = useState<TimeRange>("medium_term");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/stats?timeRange=${timeRange}`);
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [timeRange]);

  function formatDuration(ms: number) {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  async function playUri(uri: string) {
    try {
      await fetch("/api/player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "play", uri }),
      });
    } catch {
      // ignore errors
    }
  }

  return (
    <div className="stats-container">
      {/* Time Range Selector */}
      <div className="time-selector">
        {(Object.keys(TIME_LABELS) as TimeRange[]).map((range) => (
          <button
            key={range}
            className={`time-btn ${timeRange === range ? "active" : ""}`}
            onClick={() => setTimeRange(range)}
          >
            {TIME_LABELS[range]}
          </button>
        ))}
      </div>

      {loading && (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading your stats...</p>
        </div>
      )}

      {error && <div className="error-box">{error}</div>}

      {stats && !loading && (
        <div className="stats-grid">
          {/* Top Tracks */}
          <div className="stats-card">
            <h2>Top Tracks</h2>
            <div className="tracks-list">
              {stats.topTracks.map((track, i) => (
                <div
                  key={track.id}
                  className="track-item clickable"
                  onClick={() => playUri(track.uri)}
                >
                  <span className="track-rank">{i + 1}</span>
                  <div className="track-img-wrapper">
                    <img
                      src={track.album.images[2]?.url || track.album.images[0]?.url}
                      alt=""
                      className="track-img"
                    />
                    <div className="play-overlay">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="track-info">
                    <span className="track-name">{track.name}</span>
                    <span className="track-artist">
                      {track.artists.map((a) => a.name).join(", ")}
                    </span>
                  </div>
                  <span className="track-duration">{formatDuration(track.duration_ms)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Artists */}
          <div className="stats-card">
            <h2>Top Artists</h2>
            <div className="artists-list">
              {stats.topArtists.map((artist, i) => (
                <div
                  key={artist.id}
                  className="artist-item clickable"
                  onClick={() => playUri(artist.uri)}
                >
                  <span className="track-rank">{i + 1}</span>
                  <div className="track-img-wrapper">
                    <img
                      src={artist.images[2]?.url || artist.images[0]?.url}
                      alt=""
                      className="artist-img"
                    />
                    <div className="play-overlay">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="artist-info">
                    <span className="artist-name">{artist.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recently Played */}
          {stats.recentlyPlayed?.length > 0 && (
            <div className="stats-card recent-card">
              <h2>Recently Played</h2>
              <div className="tracks-list">
                {stats.recentlyPlayed.map((item) => (
                  <div
                    key={`${item.track.id}-${item.played_at}`}
                    className="track-item clickable"
                    onClick={() => playUri(item.track.uri)}
                  >
                    <div className="track-img-wrapper">
                      <img
                        src={item.track.album.images[2]?.url || item.track.album.images[0]?.url}
                        alt=""
                        className="track-img"
                      />
                      <div className="play-overlay">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="track-info">
                      <span className="track-name">{item.track.name}</span>
                      <span className="track-artist">
                        {item.track.artists.map((a) => a.name).join(", ")}
                      </span>
                    </div>
                    <span className="track-time">{formatTimeAgo(item.played_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
