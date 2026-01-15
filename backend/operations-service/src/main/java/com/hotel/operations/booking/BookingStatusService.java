package com.hotel.operations.booking;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
public class BookingStatusService {

    private final RestTemplate restTemplate;

    @Value("${app.services.booking.base-url:http://localhost:8081}")
    private String bookingBaseUrl;

    public void checkIn(Integer reservationId, String authHeader) {
        String url = bookingBaseUrl + "/api/reservations/" + reservationId + "/status?value=ZAKWATEROWANE";

        HttpHeaders headers = new HttpHeaders();
        if (authHeader != null && !authHeader.isBlank()) {
            headers.set(HttpHeaders.AUTHORIZATION, authHeader);
        }

        HttpEntity<Void> entity = new HttpEntity<>(headers);
        restTemplate.exchange(url, HttpMethod.PATCH, entity, Void.class);
    }

    public void checkOut(Integer reservationId, String authHeader) {
        String url = bookingBaseUrl + "/api/reservations/" + reservationId + "/status?value=WYKWATEROWANE";

        HttpHeaders headers = new HttpHeaders();
        if (authHeader != null && !authHeader.isBlank()) {
            headers.set(HttpHeaders.AUTHORIZATION, authHeader);
        }

        HttpEntity<Void> entity = new HttpEntity<>(headers);
        restTemplate.exchange(url, HttpMethod.PATCH, entity, Void.class);
    }
}
