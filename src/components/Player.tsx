"use client";

import { useState, useEffect, useRef } from "react";

interface PlaybackState {
  is_playing: boolean;
  item: {
    id: string;
    name: string;
    artists: { name: string }[];
    album: {
      name: string;
      images: { url: string }[];
    };
    duration_ms: number;
  };
  progress_ms: number;
  device: {
    id: string;
    name: string;
    volume_percent: number;
  };
}

interface Device {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  volume_percent: number;
}

export function Player() {
  const [playback, setPlayback] = useState<PlaybackState | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [showDevices, setShowDevices] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const isChangingVolumeRef = useRef(false);

  async function fetchPlayback() {
    try {
      const res = await fetch("/api/player");
      if (res.ok) {
        const data = await res.json();
        setPlayback(data);
        setIsPlaying(data?.is_playing ?? false);
        setCurrentProgress(data?.progress_ms ?? 0);
        if (data?.device?.volume_percent !== undefined && !isChangingVolumeRef.current) {
          setVolume(data.device.volume_percent);
        }
      } else {
        setPlayback(null);
      }
    } catch {
      setPlayback(null);
    }
  }

  async function fetchDevices() {
    try {
      const res = await fetch("/api/player?type=devices");
      if (res.ok) {
        const data = await res.json();
        setDevices(data.devices || []);
      }
    } catch {
      setDevices([]);
    }
  }

  useEffect(() => {
    const initialFetch = window.setTimeout(() => {
      void fetchPlayback();
    }, 0);
    const interval = window.setInterval(() => {
      void fetchPlayback();
    }, 3000);
    return () => {
      window.clearTimeout(initialFetch);
      window.clearInterval(interval);
    };
  }, []);

  async function handleAction(action: string, extra?: object) {
    try {
      fetch("/api/player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
    } catch {
      // ignore
    }
  }

  function handlePlayPause() {
    const newState = !isPlaying;
    setIsPlaying(newState);
    handleAction(newState ? "play" : "pause");
  }

  function handleNext() {
    handleAction("next");
    setTimeout(fetchPlayback, 500);
  }

  function handlePrevious() {
    handleAction("previous");
    setTimeout(fetchPlayback, 500);
  }

  function handleVolumeChange(newVolume: number) {
    isChangingVolumeRef.current = true;
    setVolume(newVolume);
  }

  function commitVolumeChange(newVolume: number) {
    handleAction("volume", { volume: newVolume });
    setTimeout(() => {
      isChangingVolumeRef.current = false;
    }, 250);
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    if (!playback?.item || !progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newPosition = Math.floor(percentage * playback.item.duration_ms);

    setCurrentProgress(newPosition);
    handleAction("seek", { position: newPosition });
  }

  async function handleDeviceSelect(deviceId: string) {
    setShowDevices(false);
    await handleAction("transfer", { deviceId });
  }

  function toggleDevices() {
    if (!showDevices) {
      fetchDevices();
    }
    setShowDevices(!showDevices);
  }

  function formatTime(ms: number) {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function getDeviceIcon(type: string) {
    switch (type.toLowerCase()) {
      case "computer":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z" />
          </svg>
        );
      case "smartphone":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z" />
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
          </svg>
        );
    }
  }

  if (!playback?.item) {
    return (
      <div className="player player-empty">
        <span>No active playback - Open Spotify to start playing</span>
      </div>
    );
  }

  const progress = (currentProgress / playback.item.duration_ms) * 100;

  return (
    <div className="player">
      <div className="player-track">
        <img
          src={playback.item.album.images[2]?.url || playback.item.album.images[0]?.url}
          alt=""
          className="player-img"
        />
        <div className="player-info">
          <span className="player-name">{playback.item.name}</span>
          <span className="player-artist">
            {playback.item.artists.map((a) => a.name).join(", ")}
          </span>
        </div>
      </div>

      <div className="player-controls">
        <button className="player-btn" onClick={handlePrevious}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>
        <button className="player-btn player-btn-main" onClick={handlePlayPause}>
          {isPlaying ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <button className="player-btn" onClick={handleNext}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>
      </div>

      <div className="player-progress">
        <span className="player-time">{formatTime(currentProgress)}</span>
        <div className="player-bar" ref={progressBarRef} onClick={handleSeek}>
          <div className="player-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="player-time">{formatTime(playback.item.duration_ms)}</span>
      </div>

      <div className="player-volume">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          {volume === 0 ? (
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
          ) : volume < 50 ? (
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
          ) : (
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          )}
        </svg>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => handleVolumeChange(Number(e.target.value))}
          onMouseUp={(e) => commitVolumeChange(Number(e.currentTarget.value))}
          onTouchEnd={(e) => commitVolumeChange(Number(e.currentTarget.value))}
          onKeyUp={(e) => commitVolumeChange(Number(e.currentTarget.value))}
          className="volume-slider"
        />
      </div>

      <div className="player-device-wrapper">
        <button className="player-device-btn" onClick={toggleDevices}>
          {getDeviceIcon(playback.device?.name?.includes("iPhone") ? "smartphone" : "computer")}
          <span>{playback.device?.name || "Unknown device"}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </button>

        {showDevices && (
          <div className="device-dropdown">
            <div className="device-dropdown-title">Select a device</div>
            {devices.length === 0 ? (
              <div className="device-dropdown-empty">No devices found</div>
            ) : (
              devices.map((device) => (
                <button
                  key={device.id}
                  className={`device-item ${device.is_active ? "active" : ""}`}
                  onClick={() => handleDeviceSelect(device.id)}
                >
                  {getDeviceIcon(device.type)}
                  <span>{device.name}</span>
                  {device.is_active && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent)">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
