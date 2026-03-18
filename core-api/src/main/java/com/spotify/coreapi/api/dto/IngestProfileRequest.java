package com.spotify.coreapi.api.dto;

import jakarta.validation.constraints.NotBlank;

public record IngestProfileRequest(
    @NotBlank String userId,
    @NotBlank String displayName,
    String country
) {
}
