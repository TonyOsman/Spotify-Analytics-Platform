package com.spotify.coreapi.service;

import com.spotify.coreapi.domain.Artist;
import com.spotify.coreapi.domain.Playlist;
import com.spotify.coreapi.domain.Track;
import com.spotify.coreapi.domain.UserProfile;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class AnalyticsService {
    private final Map<String, UserProfile> profiles = new ConcurrentHashMap<>();
    private final Map<String, List<Track>> topTracks = new ConcurrentHashMap<>();
    private final Map<String, List<Playlist>> playlists = new ConcurrentHashMap<>();

    public void saveProfile(UserProfile profile) {
        profiles.put(profile.userId(), profile);
    }

    public void saveTopTracks(String userId, List<Track> tracks) {
        topTracks.put(userId, tracks);
    }

    public void savePlaylists(String userId, List<Playlist> values) {
        playlists.put(userId, values);
    }

    public Map<String, Object> summary(String userId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("user", profiles.get(userId));
        payload.put("topTrackCount", topTracks.getOrDefault(userId, List.of()).size());
        payload.put("playlistCount", playlists.getOrDefault(userId, List.of()).size());
        payload.put("diversityScore", diversityScore(userId));
        return payload;
    }

    public List<Track> getTopTracks(String userId) {
        return topTracks.getOrDefault(userId, List.of());
    }

    public List<Playlist> getPlaylists(String userId) {
        return playlists.getOrDefault(userId, List.of());
    }

    public Map<String, Double> genreDistribution(String userId) {
        List<Track> tracks = topTracks.getOrDefault(userId, List.of());
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
        Map<String, Double> result = new HashMap<>();
        if (total == 0) {
            return result;
        }
        for (Map.Entry<String, Integer> entry : raw.entrySet()) {
            result.put(entry.getKey(), (entry.getValue() * 100.0) / total);
        }
        return result.entrySet()
            .stream()
            .sorted(Map.Entry.comparingByValue(Comparator.reverseOrder()))
            .collect(HashMap::new, (m, e) -> m.put(e.getKey(), e.getValue()), HashMap::putAll);
    }

    public Map<String, Object> audioFeatureTrends(String userId) {
        List<Track> tracks = topTracks.getOrDefault(userId, List.of());
        double averageDuration = tracks.stream().mapToInt(Track::durationMs).average().orElse(0.0);
        Map<String, Object> payload = new HashMap<>();
        payload.put("sampleSize", tracks.size());
        payload.put("averageDurationMs", averageDuration);
        payload.put("window", "all-time");
        return payload;
    }

    public double diversityScore(String userId) {
        Map<String, Double> distribution = genreDistribution(userId);
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
