package com.hotel.booking.reservation;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import java.util.Objects;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
public class CatalogClient {

    private final RestTemplate restTemplate;

    @Value("${app.services.catalog.base-url}")
    private String catalogBaseUrl;

    public RoomSnapshot getRoom(Integer roomId) {
        return restTemplate.getForObject(
                catalogBaseUrl + "/api/rooms/" + roomId,
                RoomSnapshot.class
        );
    }

    public List<RoomSnapshot> getAvailableRooms(Integer hotelId, LocalDate from, LocalDate to) {
        String url = UriComponentsBuilder
                .fromHttpUrl(catalogBaseUrl)
                .path("/api/rooms/available")
                .queryParam("hotelId", hotelId)
                .queryParam("from", from)
                .queryParam("to", to)
                .toUriString();

        RoomSnapshot[] response = restTemplate.getForObject(url, RoomSnapshot[].class);
        return response == null ? List.of() : Arrays.asList(response);
    }

    public MealSnapshot getMealByType(String type) {
        String url = UriComponentsBuilder
                .fromHttpUrl(catalogBaseUrl)
                .path("/catering/by-type")
                .queryParam("type", type)
                .toUriString();

        return restTemplate.getForObject(url, MealSnapshot.class);
    }

    public ServiceSnapshot getService(Integer id) {
        return restTemplate.getForObject(
                catalogBaseUrl + "/services/" + id,
                ServiceSnapshot.class
        );
    }

    public record MealSnapshot(
            Integer id,
            String type,
            BigDecimal price
    ) {}

    public record ServiceSnapshot(
            Integer id,
            String name,
            String billingType,
            BigDecimal price
    ) {}

    public record RoomSnapshot(
            Integer id,
            Integer hotelId,
            String hotelName,
            String roomNumber,
            String type,
            Integer numberOfBeds,
            BigDecimal price,
            String status
    ) {}
}
