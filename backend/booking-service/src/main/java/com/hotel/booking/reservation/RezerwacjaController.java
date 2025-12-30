package com.hotel.booking.reservation;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/reservations")
@RequiredArgsConstructor
public class RezerwacjaController {
    private final RezerwacjaRepository repo;

    @GetMapping
    public List<Rezerwacja> getAll() {
        return repo.findAll();
    }

    @PostMapping
    public Rezerwacja create(@RequestBody Rezerwacja rezerwacja) {
        rezerwacja.setId(null);
        return repo.save(rezerwacja);
    }
}
