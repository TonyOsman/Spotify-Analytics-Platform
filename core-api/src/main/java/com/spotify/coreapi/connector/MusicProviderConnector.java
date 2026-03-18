package com.spotify.coreapi.connector;

import com.spotify.coreapi.api.dto.IngestPlaylistsRequest;
import com.spotify.coreapi.api.dto.IngestTopItemsRequest;
import com.spotify.coreapi.domain.Playlist;
import com.spotify.coreapi.domain.Track;
import java.util.List;

public interface MusicProviderConnector {
    List<Track> mapTopItems(List<IngestTopItemsRequest.TrackPayload> payload);
    List<Playlist> mapPlaylists(List<IngestPlaylistsRequest.PlaylistPayload> payload);
}
