package com.spotify.coreapi.service;

import org.springframework.stereotype.Component;

@Component
public class RetryPolicy {
    private static final int MAX_ATTEMPTS = 3;

    public boolean shouldRetry(int attempt, int statusCode) {
        if (attempt >= MAX_ATTEMPTS) {
            return false;
        }
        return statusCode == 429 || statusCode >= 500;
    }
}
