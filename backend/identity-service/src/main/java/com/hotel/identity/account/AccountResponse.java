package com.hotel.identity.account;

public record AccountResponse(
        Integer id,
        String email,
        String role,
        Integer employeeId,
        Integer guestId,
        Integer hotelId,
        String position
) {}
