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

    @NotNull(message = "Data zameldowania jest wymagana")
    @FutureOrPresent(message = "Data zameldowania musi być dzisiejsza lub przyszła")
    private LocalDate checkInDate;

    @NotNull(message = "Data wymeldowania jest wymagana")
    @Future(message = "Data wymeldowania musi być datą przyszłą")
    private LocalDate checkOutDate;

    private BigDecimal clientPrice;
}