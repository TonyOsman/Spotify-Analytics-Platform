package com.spotify.coreapi.service;

import com.spotify.coreapi.auth.TokenCipher;
import com.spotify.coreapi.domain.SpotifyToken;
import com.spotify.coreapi.domain.UserProfile;
import com.spotify.coreapi.repository.TokenRepository;
import com.spotify.coreapi.repository.UserRepository;
import java.time.Instant;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class TokenService {
    private final TokenRepository tokenRepository;
    private final TokenCipher tokenCipher;
    private final UserRepository userRepository;
    private final String tokenSecret;

    public TokenService(
        TokenRepository tokenRepository,
        TokenCipher tokenCipher,
        UserRepository userRepository,
        @Value("${app.token.secret}") String tokenSecret
    ) {
        this.tokenRepository = tokenRepository;
        this.tokenCipher = tokenCipher;
        this.userRepository = userRepository;
        this.tokenSecret = tokenSecret;
    }

    public void upsert(SpotifyToken token) {
        userRepository.findById(token.userId()).orElseGet(() -> {
            UserProfile profile = new UserProfile(token.userId(), token.userId(), null);
            userRepository.upsert(profile);
            return profile;
        });
        tokenRepository.upsert(new SpotifyToken(
            token.userId(),
            tokenCipher.encrypt(token.accessToken(), tokenSecret),
            tokenCipher.encrypt(token.refreshToken(), tokenSecret),
            token.expiresAt()
        ));
    }

    public Optional<SpotifyToken> findByUserId(String userId) {
        return tokenRepository.findByUserId(userId)
            .map(token -> new SpotifyToken(
                token.userId(),
                tokenCipher.decrypt(token.accessToken(), tokenSecret),
                tokenCipher.decrypt(token.refreshToken(), tokenSecret),
                token.expiresAt()
            ));
    }

    public boolean tokenExpired(String userId) {
        return tokenRepository.tokenExpired(userId, Instant.now());
    }

    public void revoke(String userId) {
        tokenRepository.deleteByUserId(userId);
    }
}
