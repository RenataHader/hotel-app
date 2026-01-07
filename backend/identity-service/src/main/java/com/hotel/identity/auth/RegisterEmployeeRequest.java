package com.hotel.identity.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RegisterEmployeeRequest(
        @Email @NotBlank String email,
        @NotBlank String password,
        @NotNull Integer employeeId,
        @NotBlank String role // docelowo enum, ale na razie zostawimy string
) {}
