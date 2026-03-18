package com.spotify.coreapi.domain;

import java.util.List;

public record Artist(String provider, String providerObjectId, String name, List<String> genres) {
}
