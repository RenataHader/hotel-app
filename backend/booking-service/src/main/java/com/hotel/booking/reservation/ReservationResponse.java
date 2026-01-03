package com.hotel.booking.reservation;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class ReservationResponse {
    private Integer id;
    private String guestFullName;
    private Integer roomId;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private String status;
}