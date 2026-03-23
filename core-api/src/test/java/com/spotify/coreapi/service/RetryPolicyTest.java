package com.spotify.coreapi.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class RetryPolicyTest {
    private final RetryPolicy retryPolicy = new RetryPolicy();

    @Test
    void shouldRetryOnRateLimitAndServerErrors() {
        assertThat(retryPolicy.shouldRetry(1, 429)).isTrue();
        assertThat(retryPolicy.shouldRetry(1, 500)).isTrue();
    }

    @Test
    void shouldNotRetryOnClientErrorOrMaxAttempt() {
        assertThat(retryPolicy.shouldRetry(1, 400)).isFalse();
        assertThat(retryPolicy.shouldRetry(3, 500)).isFalse();
    }
}
