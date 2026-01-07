package com.hotel.booking.reservation;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ReservationRequest {

    @NotNull(message = "Guest ID is required")
    private Integer guestId;

    @NotNull(message = "Hotel ID is required")
    private Integer hotelId;

    @NotBlank(message = "Hotel name is required")
    private String hotelName;

    @NotNull(message = "Room ID is required")
    private Integer roomId;

    @NotBlank(message = "Room number is required")
    private String roomNumber;

    @NotNull(message = "Check-in date is required")
    @FutureOrPresent(message = "Check-in date must be today or in the future")
    private LocalDate checkInDate;

    @NotNull(message = "Check-out date is required")
    @Future(message = "Check-out date must be in the future")
    private LocalDate checkOutDate;

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be positive")
    private BigDecimal price;
}