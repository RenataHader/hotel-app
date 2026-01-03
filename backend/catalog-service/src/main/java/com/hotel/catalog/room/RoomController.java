package com.hotel.catalog.room;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/rooms")
@RequiredArgsConstructor
public class RoomController {
    private final RoomRepository repo;

    @GetMapping
    public List<Room> getAll() {
        return repo.findAll();
    }

    @PostMapping
    public Room create(@RequestBody Room room) {
        room.setId(null);
        return repo.save(room);
    }
}
