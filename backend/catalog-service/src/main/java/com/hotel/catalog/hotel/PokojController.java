package com.hotel.catalog.hotel;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/rooms")
@RequiredArgsConstructor
public class PokojController {
    private final PokojRepository repo;

    @GetMapping
    public List<Pokoj> getAll() {
        return repo.findAll();
    }

    @PostMapping
    public Pokoj create(@RequestBody Pokoj pokoj) {
        pokoj.setId(null);
        return repo.save(pokoj);
    }
}
