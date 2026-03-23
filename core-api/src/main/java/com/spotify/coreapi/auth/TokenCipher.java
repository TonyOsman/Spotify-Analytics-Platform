package com.spotify.coreapi.auth;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import org.springframework.stereotype.Component;

@Component
public class TokenCipher {
    public String encrypt(String token, String secret) {
        byte[] input = token.getBytes(StandardCharsets.UTF_8);
        byte[] key = secret.getBytes(StandardCharsets.UTF_8);
        byte[] output = new byte[input.length];
        for (int i = 0; i < input.length; i++) {
            output[i] = (byte) (input[i] ^ key[i % key.length]);
        }
        return Base64.getEncoder().encodeToString(output);
    }

    public String decrypt(String encryptedToken, String secret) {
        byte[] input = Base64.getDecoder().decode(encryptedToken);
        byte[] key = secret.getBytes(StandardCharsets.UTF_8);
        byte[] output = new byte[input.length];
        for (int i = 0; i < input.length; i++) {
            output[i] = (byte) (input[i] ^ key[i % key.length]);
        }
        return new String(output, StandardCharsets.UTF_8);
    }
}
