package com.spotify.coreapi.auth;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class PkceServiceTest {
    private final PkceService pkceService = new PkceService();

    @Test
    void shouldGenerateDeterministicChallenge() {
        String verifier = "abc123-verifier";
        String challengeA = pkceService.challengeFromVerifier(verifier);
        String challengeB = pkceService.challengeFromVerifier(verifier);
        assertThat(challengeA).isEqualTo(challengeB);
    }

    @Test
    void shouldValidateVerifierAgainstExpectedChallenge() {
        String verifier = "verifier-xyz";
        String challenge = pkceService.challengeFromVerifier(verifier);
        assertThat(pkceService.verifierMatches(verifier, challenge)).isTrue();
        assertThat(pkceService.verifierMatches("wrong", challenge)).isFalse();
    }
}
