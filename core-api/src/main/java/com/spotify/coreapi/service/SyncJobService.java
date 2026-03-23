package com.spotify.coreapi.service;

import com.spotify.coreapi.domain.Artist;
import com.spotify.coreapi.domain.Playlist;
import com.spotify.coreapi.domain.SpotifyToken;
import com.spotify.coreapi.domain.SyncJob;
import com.spotify.coreapi.domain.Track;
import com.spotify.coreapi.repository.SyncJobRepository;
import com.spotify.coreapi.repository.UserRepository;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class SyncJobService {
    private final SyncJobRepository syncJobRepository;
    private final UserRepository userRepository;
    private final AnalyticsService analyticsService;
    private final TokenService tokenService;
    private final RetryPolicy retryPolicy;

    public SyncJobService(
        SyncJobRepository syncJobRepository,
        UserRepository userRepository,
        AnalyticsService analyticsService,
        TokenService tokenService,
        RetryPolicy retryPolicy
    ) {
        this.syncJobRepository = syncJobRepository;
        this.userRepository = userRepository;
        this.analyticsService = analyticsService;
        this.tokenService = tokenService;
        this.retryPolicy = retryPolicy;
    }

    public SyncJob enqueue(String userId) {
        userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        SyncJob job = syncJobRepository.create(userId);
        syncJobRepository.addEvent(job.jobId(), "ENQUEUED", "Sync job queued");
        return job;
    }

    public Optional<SyncJob> findById(UUID jobId) {
        return syncJobRepository.findById(jobId);
    }

    public Map<String, Object> syncState(String userId) {
        Optional<SyncJob> latestJob = syncJobRepository.findLatestByUserId(userId);
        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", userId);
        payload.put("hasSpotifyToken", tokenService.findByUserId(userId).isPresent());
        payload.put("tokenExpired", tokenService.tokenExpired(userId));
        payload.put("lastJob", latestJob.orElse(null));
        return payload;
    }

    @Scheduled(fixedDelay = 5000L)
    public void processQueuedJobs() {
        List<SyncJob> queuedJobs = syncJobRepository.findQueuedJobs(10);
        for (SyncJob job : queuedJobs) {
            processJob(job);
        }
    }

    private void processJob(SyncJob job) {
        int attempt = job.attemptCount() + 1;
        syncJobRepository.updateStatus(job.jobId(), "RUNNING", attempt, null);
        syncJobRepository.addEvent(job.jobId(), "RUNNING", "Processing sync attempt " + attempt);

        try {
            SpotifyToken token = tokenService.findByUserId(job.userId())
                .orElseThrow(() -> new IllegalStateException("Spotify token missing"));

            if (token.expiresAt().isBefore(Instant.now())) {
                throw new SyncJobException("Token expired", 401);
            }

            List<Track> tracks = List.of(
                new Track("spotify", "synced-track-1", "Synced Track One", List.of(
                    new Artist("spotify", "synced-artist-1", "Synced Artist", List.of("pop", "electro"))
                ), 201000),
                new Track("spotify", "synced-track-2", "Synced Track Two", List.of(
                    new Artist("spotify", "synced-artist-2", "Another Artist", List.of("rock"))
                ), 185000)
            );
            List<Playlist> playlists = List.of(
                new Playlist("spotify", "synced-playlist-1", "Synced Playlist", 23)
            );
            analyticsService.saveTopTracks(job.userId(), tracks);
            analyticsService.savePlaylists(job.userId(), playlists);

            syncJobRepository.updateStatus(job.jobId(), "COMPLETED", attempt, null);
            syncJobRepository.addEvent(job.jobId(), "COMPLETED", "Sync completed");
        } catch (SyncJobException exception) {
            boolean retry = retryPolicy.shouldRetry(attempt, exception.statusCode());
            if (retry) {
                syncJobRepository.updateStatus(job.jobId(), "RETRYING", attempt, exception.getMessage());
                syncJobRepository.addEvent(job.jobId(), "RETRYING", exception.getMessage());
            } else {
                syncJobRepository.updateStatus(job.jobId(), "FAILED", attempt, exception.getMessage());
                syncJobRepository.addEvent(job.jobId(), "FAILED", exception.getMessage());
            }
        } catch (Exception exception) {
            syncJobRepository.updateStatus(job.jobId(), "FAILED", attempt, exception.getMessage());
            syncJobRepository.addEvent(job.jobId(), "FAILED", exception.getMessage());
        }
    }

    public static class SyncJobException extends RuntimeException {
        private final int statusCode;

        public SyncJobException(String message, int statusCode) {
            super(message);
            this.statusCode = statusCode;
        }

        public int statusCode() {
            return statusCode;
        }
    }
}
