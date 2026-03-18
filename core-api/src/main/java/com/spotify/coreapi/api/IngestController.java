package com.spotify.coreapi.api;

import com.spotify.coreapi.api.dto.IngestPlaylistsRequest;
import com.spotify.coreapi.api.dto.IngestProfileRequest;
import com.spotify.coreapi.api.dto.IngestTopItemsRequest;
import com.spotify.coreapi.connector.MusicProviderConnector;
import com.spotify.coreapi.domain.UserProfile;
import com.spotify.coreapi.service.AnalyticsService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ingest/spotify")
public class IngestController {
    private final AnalyticsService analyticsService;
    private final MusicProviderConnector connector;

    public IngestController(AnalyticsService analyticsService, MusicProviderConnector connector) {
        this.analyticsService = analyticsService;
        this.connector = connector;
    }

    @PostMapping("/profile")
    public ResponseEntity<Map<String, String>> ingestProfile(@Valid @RequestBody IngestProfileRequest request) {
        analyticsService.saveProfile(new UserProfile(request.userId(), request.displayName(), request.country()));
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @PostMapping("/top-items")
    public ResponseEntity<Map<String, String>> ingestTopItems(@Valid @RequestBody IngestTopItemsRequest request) {
        analyticsService.saveTopTracks(request.userId(), connector.mapTopItems(request.tracks()));
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @PostMapping("/playlists")
    public ResponseEntity<Map<String, String>> ingestPlaylists(@Valid @RequestBody IngestPlaylistsRequest request) {
        analyticsService.savePlaylists(request.userId(), connector.mapPlaylists(request.playlists()));
        return ResponseEntity.ok(Map.of("status", "ok"));
    }
}
