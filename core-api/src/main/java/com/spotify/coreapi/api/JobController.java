package com.spotify.coreapi.api;

import com.spotify.coreapi.api.dto.StartSyncRequest;
import com.spotify.coreapi.domain.SyncJob;
import com.spotify.coreapi.service.SyncJobService;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping
public class JobController {
    private final SyncJobService syncJobService;

    public JobController(SyncJobService syncJobService) {
        this.syncJobService = syncJobService;
    }

    @PostMapping("/jobs/spotify/sync")
    public ResponseEntity<SyncJob> startSync(@Valid @RequestBody StartSyncRequest request) {
        return ResponseEntity.ok(syncJobService.enqueue(request.userId()));
    }

    @GetMapping("/jobs/{jobId}")
    public ResponseEntity<SyncJob> getJob(@PathVariable UUID jobId) {
        return syncJobService.findById(jobId)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/users/{userId}/sync-state")
    public Map<String, Object> syncState(@PathVariable String userId) {
        return syncJobService.syncState(userId);
    }
}
