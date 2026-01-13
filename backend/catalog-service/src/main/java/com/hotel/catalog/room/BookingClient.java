package com.hotel.catalog.room;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDate;

@Service
public class BookingClient {
    private final WebClient web;

    public BookingClient(WebClient.Builder builder,
                         @Value("${app.services.booking.base-url:http://localhost:8081}") String baseUrl) {
        this.web = builder.baseUrl(baseUrl).build();
    }

    public boolean hasFutureReservations(Integer roomId, LocalDate from) {
        Boolean res = web.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/api/reservations/rooms/{roomId}/has-future")
                        .queryParam("from", from)
                        .build(roomId))
                .retrieve()
                .bodyToMono(Boolean.class)
                .block();
        return Boolean.TRUE.equals(res);
    }
}
