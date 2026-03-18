package com.spotify.coreapi.domain;

public record Playlist(String provider, String providerObjectId, String name, int tracksTotal) {
}
