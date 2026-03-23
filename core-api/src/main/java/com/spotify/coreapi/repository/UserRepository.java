package com.spotify.coreapi.repository;

import com.spotify.coreapi.domain.UserProfile;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class UserRepository {
    private final JdbcTemplate jdbcTemplate;

    public UserRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void upsert(UserProfile userProfile) {
        jdbcTemplate.update("""
            INSERT INTO users (user_id, display_name, country, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id)
            DO UPDATE SET display_name = EXCLUDED.display_name, country = EXCLUDED.country, updated_at = CURRENT_TIMESTAMP
            """, userProfile.userId(), userProfile.displayName(), userProfile.country());
    }

    public Optional<UserProfile> findById(String userId) {
        return jdbcTemplate.query("""
            SELECT user_id, display_name, country FROM users WHERE user_id = ?
            """, this::mapUser, userId).stream().findFirst();
    }

    private UserProfile mapUser(ResultSet rs, int rowNum) throws SQLException {
        return new UserProfile(
            rs.getString("user_id"),
            rs.getString("display_name"),
            rs.getString("country")
        );
    }
}
