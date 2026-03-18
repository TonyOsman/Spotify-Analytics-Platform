package com.spotify.coreapi.domain;

import java.util.List;

public record Track(String provider, String providerObjectId, String name, List<Artist> artists, int durationMs) {
}
