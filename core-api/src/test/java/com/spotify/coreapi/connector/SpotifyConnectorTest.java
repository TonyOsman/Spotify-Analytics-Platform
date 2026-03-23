package com.spotify.coreapi.connector;

import static org.assertj.core.api.Assertions.assertThat;

import com.spotify.coreapi.api.dto.IngestPlaylistsRequest;
import com.spotify.coreapi.api.dto.IngestTopItemsRequest;
import java.util.List;
import org.junit.jupiter.api.Test;

class SpotifyConnectorTest {
    private final SpotifyConnector spotifyConnector = new SpotifyConnector();

    @Test
    void shouldNormalizeAndMapTracks() {
        List<IngestTopItemsRequest.TrackPayload> payload = List.of(
            new IngestTopItemsRequest.TrackPayload(" Track-1 ", " Name ", 120000, List.of(
                new IngestTopItemsRequest.ArtistPayload(" Artist-1 ", " Artist Name ", List.of("pop"))
            ))
        );

        var mapped = spotifyConnector.mapTopItems(payload);
        assertThat(mapped).hasSize(1);
        assertThat(mapped.getFirst().providerObjectId()).isEqualTo("track-1");
        assertThat(mapped.getFirst().artists().getFirst().providerObjectId()).isEqualTo("artist-1");
    }

    @Test
    void shouldMapPlaylistsWithFallbackCounts() {
        List<IngestPlaylistsRequest.PlaylistPayload> payload = List.of(
            new IngestPlaylistsRequest.PlaylistPayload("P1", "Roadtrip", null)
        );
        var playlists = spotifyConnector.mapPlaylists(payload);
        assertThat(playlists).hasSize(1);
        assertThat(playlists.getFirst().tracksTotal()).isEqualTo(0);
    }
}
