package com.hotel.operations.employee;

import java.time.LocalDate;

public record EmployeeResponse(
        Integer id,
        String firstName,
        String lastName,
        String position,
        LocalDate hireDate,
        String phoneNumber,
        Integer hotelId
) {}
