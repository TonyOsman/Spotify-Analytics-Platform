package com.spotify.coreapi.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record UpsertTokenRequest(
    @NotBlank String userId,
    @NotBlank String accessToken,
    @NotBlank String refreshToken,
    @NotNull Instant expiresAt
) {
}
