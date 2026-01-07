package com.hotel.operations.booking;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
public class BookingStatusService {

    private final RestTemplate restTemplate;
    private final String BOOKING_SERVICE_URL = "http://localhost:8081/api/reservations";

    public void checkIn(Integer reservationId) {
        String url = BOOKING_SERVICE_URL + "/" + reservationId + "/status?value=CHECKED_IN";
        restTemplate.patchForObject(url, null, Void.class);
    }

    public void checkOut(Integer reservationId) {
        String url = BOOKING_SERVICE_URL + "/" + reservationId + "/status?value=CHECKED_OUT";
        restTemplate.patchForObject(url, null, Void.class);
    }
}