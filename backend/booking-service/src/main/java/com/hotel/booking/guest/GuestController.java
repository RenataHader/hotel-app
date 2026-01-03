package com.hotel.booking.guest;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/guests")
@RequiredArgsConstructor
public class GuestController {
    private final GuestRepository repo;

    @GetMapping
    public List<Guest> getAll() {
        return repo.findAll();
    }

    @PostMapping
    public Guest create(@RequestBody Guest guest) {
        guest.setId(null);
        return repo.save(guest);
    }
}
