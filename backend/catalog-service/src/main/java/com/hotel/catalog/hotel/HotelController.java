package com.hotel.catalog.hotel;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/hotels")
@RequiredArgsConstructor
public class HotelController {

    private final HotelRepository repo;

    @GetMapping
    public List<Hotel> all() {
        return repo.findAll();
    }

    @PostMapping
    public Hotel create(@RequestBody Hotel hotel) {
        hotel.setId(null);
        return repo.save(hotel);
    }
}
