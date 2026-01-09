package com.hotel.booking.reservation;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class SelectedServiceResponse {
    private Integer id;
    private String name;
    private String billingType;

    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
}
