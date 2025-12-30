package com.hotel.booking.guest;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/guests")
@RequiredArgsConstructor
public class GoscController {
    private final GoscRepository repo;

    @GetMapping
    public List<Gosc> getAll() {
        return repo.findAll();
    }

    @PostMapping
    public Gosc create(@RequestBody Gosc gosc) {
        gosc.setId(null);
        return repo.save(gosc);
    }
}
