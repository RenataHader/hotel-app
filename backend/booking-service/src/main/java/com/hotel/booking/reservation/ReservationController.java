package com.hotel.booking.reservation;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/reservations")
@RequiredArgsConstructor
public class ReservationController {
    private final ReservationRepository repo;

    @GetMapping
    public List<Reservation> getAll() {
        return repo.findAll();
    }

    @PostMapping
    public Reservation create(@RequestBody Reservation reservation) {
        reservation.setId(null);
        return repo.save(reservation);
    }
}
