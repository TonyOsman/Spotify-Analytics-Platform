package com.spotify.coreapi.api.dto;

import jakarta.validation.constraints.NotBlank;

public record StartSyncRequest(@NotBlank String userId) {
}
