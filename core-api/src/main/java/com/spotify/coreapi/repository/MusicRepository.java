package com.spotify.coreapi.repository;

import com.spotify.coreapi.domain.Artist;
import com.spotify.coreapi.domain.Playlist;
import com.spotify.coreapi.domain.Track;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class MusicRepository {
    private final JdbcTemplate jdbcTemplate;

    public MusicRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void upsertTracks(String userId, List<Track> tracks) {
        for (Track track : tracks) {
            jdbcTemplate.update("""
                INSERT INTO tracks (user_id, provider, provider_object_id, name, duration_ms)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT (user_id, provider, provider_object_id)
                DO UPDATE SET name = EXCLUDED.name, duration_ms = EXCLUDED.duration_ms
                """, userId, track.provider(), track.providerObjectId(), track.name(), track.durationMs());

            Long trackId = jdbcTemplate.queryForObject("""
                SELECT id FROM tracks WHERE user_id = ? AND provider = ? AND provider_object_id = ?
                """, Long.class, userId, track.provider(), track.providerObjectId());

            if (trackId == null) {
                continue;
            }
            jdbcTemplate.update("DELETE FROM track_artists WHERE track_id = ?", trackId);
            for (Artist artist : track.artists()) {
                jdbcTemplate.update("""
                    INSERT INTO artists (provider, provider_object_id, name, genres)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT (provider, provider_object_id)
                    DO UPDATE SET name = EXCLUDED.name, genres = EXCLUDED.genres
                    """, artist.provider(), artist.providerObjectId(), artist.name(), String.join(",", artist.genres()));
                Long artistId = jdbcTemplate.queryForObject("""
                    SELECT id FROM artists WHERE provider = ? AND provider_object_id = ?
                    """, Long.class, artist.provider(), artist.providerObjectId());
                if (artistId != null) {
                    jdbcTemplate.update("""
                        INSERT INTO track_artists (track_id, artist_id) VALUES (?, ?)
                        ON CONFLICT DO NOTHING
                        """, trackId, artistId);
                }
            }
        }
    }

    public void upsertPlaylists(String userId, List<Playlist> playlists) {
        for (Playlist playlist : playlists) {
            jdbcTemplate.update("""
                INSERT INTO playlists (user_id, provider, provider_object_id, name, tracks_total)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT (user_id, provider, provider_object_id)
                DO UPDATE SET name = EXCLUDED.name, tracks_total = EXCLUDED.tracks_total
                """, userId, playlist.provider(), playlist.providerObjectId(), playlist.name(), playlist.tracksTotal());
        }
    }

    public List<Track> getTracks(String userId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
            SELECT t.id AS track_id,
                   t.provider AS track_provider,
                   t.provider_object_id AS track_provider_object_id,
                   t.name AS track_name,
                   t.duration_ms AS track_duration_ms,
                   a.provider AS artist_provider,
                   a.provider_object_id AS artist_provider_object_id,
                   a.name AS artist_name,
                   a.genres AS artist_genres
            FROM tracks t
            LEFT JOIN track_artists ta ON ta.track_id = t.id
            LEFT JOIN artists a ON a.id = ta.artist_id
            WHERE t.user_id = ?
            ORDER BY t.id
            """, userId);

        Map<Long, TrackAccumulator> trackMap = new HashMap<>();
        for (Map<String, Object> row : rows) {
            Long trackId = (Long) row.get("track_id");
            if (!trackMap.containsKey(trackId)) {
                trackMap.put(trackId, new TrackAccumulator(
                    (String) row.get("track_provider"),
                    (String) row.get("track_provider_object_id"),
                    (String) row.get("track_name"),
                    ((Integer) row.get("track_duration_ms"))
                ));
            }
            String artistId = (String) row.get("artist_provider_object_id");
            if (artistId != null) {
                String rawGenres = (String) row.get("artist_genres");
                List<String> genres = rawGenres == null || rawGenres.isBlank()
                    ? List.of()
                    : Arrays.stream(rawGenres.split(",")).map(String::trim).toList();
                trackMap.get(trackId).artists.add(new Artist(
                    (String) row.get("artist_provider"),
                    artistId,
                    (String) row.get("artist_name"),
                    genres
                ));
            }
        }

        List<Track> result = new ArrayList<>();
        for (TrackAccumulator accumulator : trackMap.values()) {
            result.add(new Track(
                accumulator.provider,
                accumulator.providerObjectId,
                accumulator.name,
                accumulator.artists,
                accumulator.durationMs
            ));
        }
        return result;
    }

    public List<Playlist> getPlaylists(String userId) {
        return jdbcTemplate.query("""
            SELECT provider, provider_object_id, name, tracks_total
            FROM playlists
            WHERE user_id = ?
            ORDER BY id
            """, this::mapPlaylist, userId);
    }

    private Playlist mapPlaylist(ResultSet rs, int rowNum) throws SQLException {
        return new Playlist(
            rs.getString("provider"),
            rs.getString("provider_object_id"),
            rs.getString("name"),
            rs.getInt("tracks_total")
        );
    }

    private static final class TrackAccumulator {
        private final String provider;
        private final String providerObjectId;
        private final String name;
        private final int durationMs;
        private final List<Artist> artists = new ArrayList<>();

        private TrackAccumulator(String provider, String providerObjectId, String name, int durationMs) {
            this.provider = provider;
            this.providerObjectId = providerObjectId;
            this.name = name;
            this.durationMs = durationMs;
        }
    }
}
