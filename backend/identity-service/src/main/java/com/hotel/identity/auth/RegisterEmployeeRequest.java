package com.hotel.identity.auth;

import jakarta.validation.constraints.*;

public record RegisterEmployeeRequest(
        @NotBlank(message = "Email jest wymagany")
        @Email(message = "Niepoprawny format adresu email")
        String email,

        @NotBlank(message = "Hasło jest wymagane")
        @Size(min = 8, message = "Hasło musi mieć minimum 8 znaków")
        String password,

        @NotNull(message = "ID pracownika jest wymagane")
        Integer employeeId,

        @NotBlank(message = "Rola jest wymagana")
        String role
) {}