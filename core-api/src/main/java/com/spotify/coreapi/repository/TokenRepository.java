package com.spotify.coreapi.repository;

import com.spotify.coreapi.domain.SpotifyToken;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class TokenRepository {
    private final JdbcTemplate jdbcTemplate;

    public TokenRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void upsert(SpotifyToken token) {
        jdbcTemplate.update("""
            INSERT INTO spotify_tokens (user_id, access_token, refresh_token, expires_at, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id)
            DO UPDATE SET access_token = EXCLUDED.access_token,
                          refresh_token = EXCLUDED.refresh_token,
                          expires_at = EXCLUDED.expires_at,
                          updated_at = CURRENT_TIMESTAMP
            """, token.userId(), token.accessToken(), token.refreshToken(), token.expiresAt());
    }

    public Optional<SpotifyToken> findByUserId(String userId) {
        return jdbcTemplate.query("""
            SELECT user_id, access_token, refresh_token, expires_at FROM spotify_tokens WHERE user_id = ?
            """, this::mapToken, userId).stream().findFirst();
    }

    public void deleteByUserId(String userId) {
        jdbcTemplate.update("DELETE FROM spotify_tokens WHERE user_id = ?", userId);
    }

    private SpotifyToken mapToken(ResultSet rs, int rowNum) throws SQLException {
        return new SpotifyToken(
            rs.getString("user_id"),
            rs.getString("access_token"),
            rs.getString("refresh_token"),
            rs.getTimestamp("expires_at").toInstant()
        );
    }

    public boolean tokenExpired(String userId, Instant now) {
        return findByUserId(userId)
            .map(token -> token.expiresAt().isBefore(now))
            .orElse(true);
    }
}
