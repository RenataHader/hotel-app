package com.hotel.booking.hotel;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PlatnoscController {
    private final PlatnoscRepository repo;

    @GetMapping
    public List<Platnosc> getAll() {
        return repo.findAll();
    }

    @PostMapping
    public Platnosc create(@RequestBody Platnosc platnosc) {
        platnosc.setId(null);
        return repo.save(platnosc);
    }
}
