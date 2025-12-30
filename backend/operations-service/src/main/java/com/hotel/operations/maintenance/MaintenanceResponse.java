package com.hotel.operations.maintenance;

import java.time.LocalDate;

public record MaintenanceResponse(
        Integer id,
        LocalDate date,
        String description,
        String status,
        Integer durationInDays,
        Integer employeeId,
        Integer roomId
) {}
