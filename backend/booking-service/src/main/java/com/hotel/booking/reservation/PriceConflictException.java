package com.hotel.booking.reservation;

import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class PriceConflictException extends RuntimeException {
    private final BigDecimal clientPrice;
    private final BigDecimal serverPrice;
    private final ReservationQuoteResponse quote;

    public PriceConflictException(String message, BigDecimal clientPrice, BigDecimal serverPrice, ReservationQuoteResponse quote) {
        super(message);
        this.clientPrice = clientPrice;
        this.serverPrice = serverPrice;
        this.quote = quote;
    }
}
