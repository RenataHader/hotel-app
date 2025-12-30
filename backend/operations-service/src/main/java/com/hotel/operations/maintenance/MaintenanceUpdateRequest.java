package com.hotel.operations.maintenance;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record MaintenanceUpdateRequest(
        @NotNull LocalDate date,
        String description,
        @NotBlank String status,
        Integer durationInDays,
        @NotNull Integer employeeId,
        @NotNull Integer roomId
) {}