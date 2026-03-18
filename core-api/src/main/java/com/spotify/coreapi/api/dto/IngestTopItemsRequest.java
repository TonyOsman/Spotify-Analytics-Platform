package com.spotify.coreapi.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record IngestTopItemsRequest(
    @NotBlank String userId,
    @NotNull List<TrackPayload> tracks
) {
    public record ArtistPayload(String id, String name, List<String> genres) {}
    public record TrackPayload(String id, String name, Integer durationMs, List<ArtistPayload> artists) {}
}
