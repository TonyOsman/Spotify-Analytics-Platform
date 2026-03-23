package com.spotify.coreapi.analytics;

import static org.assertj.core.api.Assertions.assertThat;

import com.spotify.coreapi.domain.Artist;
import com.spotify.coreapi.domain.Track;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class AnalyticsCalculatorTest {
    private final AnalyticsCalculator analyticsCalculator = new AnalyticsCalculator();

    @Test
    void shouldComputeGenreDistribution() {
        List<Track> tracks = List.of(
            new Track("spotify", "t1", "Track 1", List.of(
                new Artist("spotify", "a1", "Artist 1", List.of("Pop", "Dance"))
            ), 100),
            new Track("spotify", "t2", "Track 2", List.of(
                new Artist("spotify", "a2", "Artist 2", List.of("Pop"))
            ), 200)
        );

        Map<String, Double> distribution = analyticsCalculator.genreDistribution(tracks);
        assertThat(distribution).containsKeys("pop", "dance");
        assertThat(distribution.get("pop")).isGreaterThan(distribution.get("dance"));
    }

    @Test
    void shouldComputeDiversityScoreWithinRange() {
        Map<String, Double> distribution = Map.of("pop", 50.0, "rock", 50.0);
        double score = analyticsCalculator.diversityScore(distribution);
        assertThat(score).isBetween(0.0, 1.0);
    }
}
