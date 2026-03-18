package com.spotify.coreapi.connector;

import com.spotify.coreapi.api.dto.IngestPlaylistsRequest;
import com.spotify.coreapi.api.dto.IngestTopItemsRequest;
import com.spotify.coreapi.domain.Artist;
import com.spotify.coreapi.domain.Playlist;
import com.spotify.coreapi.domain.Track;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Component;

@Component
public class SpotifyConnector implements MusicProviderConnector {
    private static final String PROVIDER = "spotify";

    @Override
    public List<Track> mapTopItems(List<IngestTopItemsRequest.TrackPayload> payload) {
        List<Track> tracks = new ArrayList<>();
        for (IngestTopItemsRequest.TrackPayload rawTrack : payload) {
            List<Artist> artists = new ArrayList<>();
            if (rawTrack.artists() != null) {
                for (IngestTopItemsRequest.ArtistPayload rawArtist : rawTrack.artists()) {
                    artists.add(new Artist(
                        PROVIDER,
                        normalizeProviderId(rawArtist.id()),
                        safe(rawArtist.name()),
                        rawArtist.genres() == null ? List.of() : rawArtist.genres()
                    ));
                }
            }
            tracks.add(new Track(
                PROVIDER,
                normalizeProviderId(rawTrack.id()),
                safe(rawTrack.name()),
                artists,
                rawTrack.durationMs() == null ? 0 : rawTrack.durationMs()
            ));
        }
        return tracks;
    }

    @Override
    public List<Playlist> mapPlaylists(List<IngestPlaylistsRequest.PlaylistPayload> payload) {
        List<Playlist> playlists = new ArrayList<>();
        for (IngestPlaylistsRequest.PlaylistPayload rawPlaylist : payload) {
            playlists.add(new Playlist(
                PROVIDER,
                normalizeProviderId(rawPlaylist.id()),
                safe(rawPlaylist.name()),
                rawPlaylist.tracksTotal() == null ? 0 : rawPlaylist.tracksTotal()
            ));
        }
        return playlists;
    }

    private static String normalizeProviderId(String id) {
        return id == null ? "" : id.trim().toLowerCase(Locale.ROOT);
    }

    private static String safe(String value) {
        return value == null ? "" : value.trim();
    }
}
