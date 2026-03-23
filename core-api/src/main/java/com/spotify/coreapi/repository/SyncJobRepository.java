package com.spotify.coreapi.repository;

import com.spotify.coreapi.domain.SyncJob;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class SyncJobRepository {
    private final JdbcTemplate jdbcTemplate;

    public SyncJobRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public SyncJob create(String userId) {
        UUID jobId = UUID.randomUUID();
        jdbcTemplate.update("""
            INSERT INTO sync_jobs (job_id, user_id, status, attempt_count, created_at, updated_at)
            VALUES (?, ?, 'QUEUED', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """, jobId, userId);
        return findById(jobId).orElseThrow();
    }

    public Optional<SyncJob> findById(UUID jobId) {
        return jdbcTemplate.query("""
            SELECT job_id, user_id, status, attempt_count, error_message, created_at, updated_at
            FROM sync_jobs WHERE job_id = ?
            """, this::mapJob, jobId).stream().findFirst();
    }

    public Optional<SyncJob> findLatestByUserId(String userId) {
        return jdbcTemplate.query("""
            SELECT job_id, user_id, status, attempt_count, error_message, created_at, updated_at
            FROM sync_jobs
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 1
            """, this::mapJob, userId).stream().findFirst();
    }

    public List<SyncJob> findQueuedJobs(int limit) {
        return jdbcTemplate.query("""
            SELECT job_id, user_id, status, attempt_count, error_message, created_at, updated_at
            FROM sync_jobs
            WHERE status IN ('QUEUED', 'RETRYING')
            ORDER BY created_at
            LIMIT ?
            """, this::mapJob, limit);
    }

    public void updateStatus(UUID jobId, String status, int attemptCount, String errorMessage) {
        jdbcTemplate.update("""
            UPDATE sync_jobs
            SET status = ?, attempt_count = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP
            WHERE job_id = ?
            """, status, attemptCount, errorMessage, jobId);
    }

    public void addEvent(UUID jobId, String eventType, String payload) {
        jdbcTemplate.update("""
            INSERT INTO sync_events (job_id, event_type, payload)
            VALUES (?, ?, ?)
            """, jobId, eventType, payload);
    }

    private SyncJob mapJob(ResultSet rs, int rowNum) throws SQLException {
        Instant createdAt = rs.getTimestamp("created_at").toInstant();
        Instant updatedAt = rs.getTimestamp("updated_at").toInstant();
        return new SyncJob(
            rs.getObject("job_id", UUID.class),
            rs.getString("user_id"),
            rs.getString("status"),
            rs.getInt("attempt_count"),
            rs.getString("error_message"),
            createdAt,
            updatedAt
        );
    }
}
