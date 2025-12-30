package com.hotel.catalog.meal;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/catering")
@RequiredArgsConstructor
public class WyzywienieController {
    private final WyzywienieRepository repo;

    @GetMapping
    public List<Wyzywienie> getAll() {
        return repo.findAll();
    }

    @PostMapping
    public Wyzywienie create(@RequestBody Wyzywienie wyzywienie) {
        wyzywienie.setId(null);
        return repo.save(wyzywienie);
    }
}
