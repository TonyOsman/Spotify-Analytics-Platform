package com.spotify.coreapi.domain;

import java.time.Instant;
import java.util.UUID;

public record SyncJob(
    UUID jobId,
    String userId,
    String status,
    int attemptCount,
    String errorMessage,
    Instant createdAt,
    Instant updatedAt
) {
}
