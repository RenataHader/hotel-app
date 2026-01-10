package com.hotel.booking.reservation;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class ReservationRequest {

    private Integer roomId;
    private List<Integer> roomIds;

    private Integer hotelId;

    @NotNull(message = "guestCount jest wymagane")
    @Min(value = 1, message = "guestCount musi być >= 1")
    private Integer guestCount;

    @NotNull(message = "mealId jest wymagane")
    private Integer mealId;

    private List<Integer> serviceIds;

    @NotNull(message = "Check-in date is required")
    @FutureOrPresent(message = "Check-in date must be today or in the future")
    private LocalDate checkInDate;

    @NotNull(message = "Check-out date is required")
    @Future(message = "Check-out date must be in the future")
    private LocalDate checkOutDate;

    private BigDecimal clientPrice;
}