package com.hotel.identity.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record RegisterGuestRequest(
        @Email @NotBlank String email,
        @NotBlank String password,

        @NotBlank String firstName,
        @NotBlank String lastName,
        String phoneNumber,
        @NotBlank String documentNumber
) {}