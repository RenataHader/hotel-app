package com.hotel.booking.reservation;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class ReservationResponse {
    private Integer id;
    private String guestFullName;
    private Integer hotelId;
    private String hotelName;
    private Integer roomId;
    private String roomNumber;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private BigDecimal price;
    private String status;
}