package com.spotify.coreapi.auth;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class TokenCipherTest {
    private final TokenCipher tokenCipher = new TokenCipher();

    @Test
    void shouldEncryptAndDecryptToken() {
        String secret = "local-secret";
        String token = "token-123";
        String encrypted = tokenCipher.encrypt(token, secret);

        assertThat(encrypted).isNotEqualTo(token);
        assertThat(tokenCipher.decrypt(encrypted, secret)).isEqualTo(token);
    }
}
