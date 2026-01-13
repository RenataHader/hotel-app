package com.hotel.catalog.room;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @GetMapping
    public List<RoomResponse> getAll() {
        return roomService.getAllRooms();
    }

    @GetMapping("/available")
    public List<RoomResponse> getAvailable(
            @RequestParam Integer hotelId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return roomService.getAvailableRooms(hotelId, from, to);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RoomResponse create(@RequestBody RoomRequest request) {
        return roomService.createRoom(request);
    }

    @GetMapping("/{id}")
    public RoomResponse getById(@PathVariable Integer id) {
        return roomService.getRoomById(id);
    }

    @GetMapping("/search")
    public List<RoomResponse> search(
            @RequestParam Integer hotelId,
            @RequestParam(required = false) String type
    ) {
        return roomService.searchRooms(hotelId, type);
    }

    @GetMapping("/types")
    public List<String> getTypes(@RequestParam(required = false) Integer hotelId) {
        return roomService.getRoomTypes(hotelId);
    }


}