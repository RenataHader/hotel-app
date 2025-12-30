package com.hotel.operations.employee;

import jakarta.validation.constraints.*;

import java.time.LocalDate;

public record EmployeeUpdateRequest(
        @NotBlank @Size(max = 50) String firstName,
        @NotBlank @Size(max = 50) String lastName,
        @NotBlank @Size(max = 50) String position,
        @NotNull LocalDate hireDate,
        @Size(max = 15) String phoneNumber,
        @NotNull Integer hotelId
) {}
