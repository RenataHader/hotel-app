package com.hotel.booking.reservation;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class ReservationQuoteResponse {
    private long nights;

    private Integer hotelId;
    private String hotelName;

    private List<ReservedRoomResponse> rooms;
    private Integer guestCount;
    private Integer totalBeds;

    private String mealType;
    private BigDecimal mealPricePerPerson;
    private BigDecimal mealTotal;

    private List<SelectedServiceResponse> services;
    private BigDecimal servicesTotal;

    private BigDecimal roomsTotal;
    private BigDecimal total;
}
