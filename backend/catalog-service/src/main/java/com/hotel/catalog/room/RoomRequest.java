package com.hotel.catalog.room;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class RoomRequest {
    private Integer hotelId;
    private String roomNumber;
    private String type;
    private Integer numberOfBeds;
    private BigDecimal price;
    private String description;
}