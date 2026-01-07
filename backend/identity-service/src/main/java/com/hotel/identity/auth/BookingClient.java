package com.hotel.identity.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class BookingClient {

    private final WebClient web;

    public BookingClient(WebClient.Builder builder,
                         @Value("${app.booking.url}") String baseUrl) {
        this.web = builder.baseUrl(baseUrl).build();
    }

    public Integer createGuest(CreateGuestRequest req) {
        return web.post()
                .uri("/public/guests")
                .bodyValue(req)
                .retrieve()
                .bodyToMono(CreateGuestResponse.class)
                .map(CreateGuestResponse::guestId)
                .block();
    }

    public record CreateGuestRequest(String firstName, String lastName, String phoneNumber, String documentNumber) {}
    public record CreateGuestResponse(Integer guestId) {}
}
