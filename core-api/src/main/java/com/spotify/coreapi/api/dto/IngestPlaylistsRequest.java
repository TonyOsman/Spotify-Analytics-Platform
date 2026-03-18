package com.spotify.coreapi.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record IngestPlaylistsRequest(
    @NotBlank String userId,
    @NotNull List<PlaylistPayload> playlists
) {
    public record PlaylistPayload(String id, String name, Integer tracksTotal) {}
}
