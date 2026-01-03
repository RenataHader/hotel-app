package com.hotel.booking.reservation;

import lombok.Data;
import java.time.LocalDate;

@Data
public class ReservationRequest {
    private Integer guestId;
    private Integer hotelId;
    private Integer roomId;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
}