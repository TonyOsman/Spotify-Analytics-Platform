package com.spotify.coreapi.analytics;

import com.spotify.coreapi.domain.Artist;
import com.spotify.coreapi.domain.Track;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class AnalyticsCalculator {
    public Map<String, Double> genreDistribution(List<Track> tracks) {
        Map<String, Integer> raw = new HashMap<>();
        int total = 0;
        for (Track track : tracks) {
            for (Artist artist : track.artists()) {
                for (String genre : artist.genres()) {
                    if (genre == null || genre.isBlank()) {
                        continue;
                    }
                    String normalized = genre.trim().toLowerCase();
                    raw.put(normalized, raw.getOrDefault(normalized, 0) + 1);
                    total++;
                }
            }
        }
        if (total == 0) {
            return Map.of();
        }
        Map<String, Double> result = new HashMap<>();
        for (Map.Entry<String, Integer> entry : raw.entrySet()) {
            result.put(entry.getKey(), (entry.getValue() * 100.0) / total);
        }
        return result.entrySet()
            .stream()
            .sorted(Map.Entry.comparingByValue(Comparator.reverseOrder()))
            .collect(HashMap::new, (m, e) -> m.put(e.getKey(), e.getValue()), HashMap::putAll);
    }

    public Map<String, Object> audioFeatureTrends(List<Track> tracks) {
        double averageDuration = tracks.stream().mapToInt(Track::durationMs).average().orElse(0.0);
        Map<String, Object> payload = new HashMap<>();
        payload.put("sampleSize", tracks.size());
        payload.put("averageDurationMs", averageDuration);
        payload.put("window", "all-time");
        return payload;
    }

    public double diversityScore(Map<String, Double> distribution) {
        if (distribution.isEmpty()) {
            return 0.0;
        }
        List<Double> probabilities = new ArrayList<>();
        for (double percent : distribution.values()) {
            probabilities.add(percent / 100.0);
        }
        double entropy = 0.0;
        for (double p : probabilities) {
            entropy += -p * Math.log(p);
        }
        double normalized = entropy / Math.log(probabilities.size());
        if (Double.isNaN(normalized)) {
            return 0.0;
        }
        return Math.max(0.0, Math.min(1.0, normalized));
    }
}
