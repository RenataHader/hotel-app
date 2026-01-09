package com.hotel.catalog.room;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class RoomResponse {
    private Integer id;
    private String hotelName;
    private String roomNumber;
    private String type;
    private Integer numberOfBeds;
    private BigDecimal price;
    private String status;
    private Integer hotelId;
}