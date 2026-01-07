package com.hotel.security;

import java.security.Principal;

public record JwtUser(
        String email,
        Integer accountId,
        String role,
        Integer hotelId
) implements Principal {
    @Override public String getName() { return email; }
}
