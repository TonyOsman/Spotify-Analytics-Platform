package com.spotify.coreapi.domain;

import java.time.Instant;

public record SpotifyToken(
    String userId,
    String accessToken,
    String refreshToken,
    Instant expiresAt
) {
}
