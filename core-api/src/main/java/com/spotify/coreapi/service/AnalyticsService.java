package com.spotify.coreapi.service;

import com.spotify.coreapi.analytics.AnalyticsCalculator;
import com.spotify.coreapi.domain.Playlist;
import com.spotify.coreapi.domain.Track;
import com.spotify.coreapi.domain.UserProfile;
import com.spotify.coreapi.repository.MusicRepository;
import com.spotify.coreapi.repository.UserRepository;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class AnalyticsService {
    private final UserRepository userRepository;
    private final MusicRepository musicRepository;
    private final AnalyticsCalculator analyticsCalculator;
    private final StringRedisTemplate redisTemplate;

    public AnalyticsService(
        UserRepository userRepository,
        MusicRepository musicRepository,
        AnalyticsCalculator analyticsCalculator,
        StringRedisTemplate redisTemplate
    ) {
        this.userRepository = userRepository;
        this.musicRepository = musicRepository;
        this.analyticsCalculator = analyticsCalculator;
        this.redisTemplate = redisTemplate;
    }

    public void saveProfile(UserProfile profile) {
        userRepository.upsert(profile);
        invalidateCache(profile.userId());
    }

    public void saveTopTracks(String userId, List<Track> tracks) {
        userRepository.findById(userId).orElseGet(() -> {
            UserProfile profile = new UserProfile(userId, userId, null);
            userRepository.upsert(profile);
            return profile;
        });
        musicRepository.upsertTracks(userId, tracks);
        invalidateCache(userId);
    }

    public void savePlaylists(String userId, List<Playlist> values) {
        userRepository.findById(userId).orElseGet(() -> {
            UserProfile profile = new UserProfile(userId, userId, null);
            userRepository.upsert(profile);
            return profile;
        });
        musicRepository.upsertPlaylists(userId, values);
        invalidateCache(userId);
    }

    public Map<String, Object> summary(String userId) {
        String key = "summary:" + userId;
        try {
            String cached = redisTemplate.opsForValue().get(key);
            if (cached != null) {
                String[] parts = cached.split("\\|");
                if (parts.length == 3) {
                    return Map.of(
                        "userId", userId,
                        "topTrackCount", Integer.parseInt(parts[0]),
                        "playlistCount", Integer.parseInt(parts[1]),
                        "diversityScore", Double.parseDouble(parts[2])
                    );
                }
            }
        } catch (Exception ignored) {
        }

        List<Track> tracks = getTopTracks(userId);
        List<Playlist> playlists = getPlaylists(userId);
        double diversityScore = analyticsCalculator.diversityScore(analyticsCalculator.genreDistribution(tracks));
        Map<String, Object> payload = new HashMap<>();
        payload.put("user", userRepository.findById(userId).orElse(null));
        payload.put("topTrackCount", tracks.size());
        payload.put("playlistCount", playlists.size());
        payload.put("diversityScore", diversityScore);

        try {
            String compact = tracks.size() + "|" + playlists.size() + "|" + diversityScore;
            redisTemplate.opsForValue().set(key, compact, Duration.ofMinutes(3));
        } catch (Exception ignored) {
        }
        return payload;
    }

    public List<Track> getTopTracks(String userId) {
        return musicRepository.getTracks(userId);
    }

    public List<Playlist> getPlaylists(String userId) {
        return musicRepository.getPlaylists(userId);
    }

    public Map<String, Double> genreDistribution(String userId) {
        return analyticsCalculator.genreDistribution(getTopTracks(userId));
    }

    public Map<String, Object> audioFeatureTrends(String userId) {
        return analyticsCalculator.audioFeatureTrends(getTopTracks(userId));
    }

    public double diversityScore(String userId) {
        return analyticsCalculator.diversityScore(genreDistribution(userId));
    }

    private void invalidateCache(String userId) {
        try {
            redisTemplate.delete("summary:" + userId);
        } catch (Exception ignored) {
        }
    }
}
