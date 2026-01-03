package com.hotel.booking.reservation;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    @GetMapping
    public List<ReservationResponse> getAll() {
        return reservationService.getAllReservations();
    }

    @PostMapping
    public ReservationResponse create(@RequestBody ReservationRequest request) {
        return reservationService.createReservation(request);
    }
}