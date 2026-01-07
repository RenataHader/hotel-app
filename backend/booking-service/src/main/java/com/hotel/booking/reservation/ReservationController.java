package com.hotel.booking.reservation;

import jakarta.validation.Valid;
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
    public ReservationResponse create(@Valid @RequestBody ReservationRequest request) {
        return reservationService.createReservation(request);
    }
}