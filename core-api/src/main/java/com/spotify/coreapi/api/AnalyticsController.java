package com.spotify.coreapi.api;

import com.spotify.coreapi.service.AnalyticsService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping
public class AnalyticsController {
    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/analytics/genre-distribution")
    public Map<String, Double> genreDistribution(@RequestParam(defaultValue = "demo-user") String userId) {
        return analyticsService.genreDistribution(userId);
    }

    @GetMapping("/analytics/audio-feature-trends")
    public Map<String, Object> audioFeatureTrends(@RequestParam(defaultValue = "demo-user") String userId) {
        return analyticsService.audioFeatureTrends(userId);
    }

    @GetMapping("/analytics/diversity-score")
    public Map<String, Double> diversityScore(@RequestParam(defaultValue = "demo-user") String userId) {
        return Map.of("score", analyticsService.diversityScore(userId));
    }

    @GetMapping("/internal/users/{userId}/summary")
    public Map<String, Object> summary(@PathVariable String userId) {
        return analyticsService.summary(userId);
    }

    @GetMapping("/internal/users/{userId}/top")
    public Object top(@PathVariable String userId) {
        return analyticsService.getTopTracks(userId);
    }

    @GetMapping("/internal/users/{userId}/playlists")
    public Object playlists(@PathVariable String userId) {
        return analyticsService.getPlaylists(userId);
    }
}
