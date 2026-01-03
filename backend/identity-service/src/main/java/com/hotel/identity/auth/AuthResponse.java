package com.hotel.identity.auth;

public record AuthResponse(
        String token,
        String tokenType,
        long expiresIn,
        Integer accountId,
        String email,
        String role
) {}
