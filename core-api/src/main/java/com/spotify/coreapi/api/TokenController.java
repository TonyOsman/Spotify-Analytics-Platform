package com.spotify.coreapi.api;

import com.spotify.coreapi.api.dto.UpsertTokenRequest;
import com.spotify.coreapi.domain.SpotifyToken;
import com.spotify.coreapi.service.TokenService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/tokens/spotify")
public class TokenController {
    private final TokenService tokenService;

    public TokenController(TokenService tokenService) {
        this.tokenService = tokenService;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> upsert(@Valid @RequestBody UpsertTokenRequest request) {
        tokenService.upsert(new SpotifyToken(
            request.userId(),
            request.accessToken(),
            request.refreshToken(),
            request.expiresAt()
        ));
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Map<String, String>> revoke(@PathVariable String userId) {
        tokenService.revoke(userId);
        return ResponseEntity.ok(Map.of("status", "ok"));
    }
}
