package com.hotel.booking.reservation;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ReservedRoomResponse {
    private Integer roomId;
    private String roomNumber;
    private String type;
    private Integer numberOfBeds;
    private BigDecimal pricePerNight;
}
