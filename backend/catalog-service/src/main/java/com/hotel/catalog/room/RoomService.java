package com.hotel.catalog.room;

import com.hotel.catalog.hotel.HotelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomService {
    private final RoomRepository roomRepo;
    private final HotelRepository hotelRepo;
    private final RestTemplate restTemplate;

    public List<RoomResponse> getAllRooms() {
        return roomRepo.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<RoomResponse> getAvailableRooms(Integer hotelId, LocalDate from, LocalDate to) {
        String url = "http://localhost:8081/api/reservations/reserved-ids?from=" + from + "&to=" + to;

        List<Integer> reservedIds;
        try {
            Integer[] response = restTemplate.getForObject(url, Integer[].class);
            reservedIds = (response != null) ? Arrays.asList(response) : List.of();
        } catch (Exception e) {
            reservedIds = List.of();
        }

        List<Room> availableRooms;
        if (reservedIds.isEmpty()) {
            availableRooms = roomRepo.findAllByHotelId(hotelId);
        } else {
            availableRooms = roomRepo.findAllByHotelIdAndIdNotIn(hotelId, reservedIds);
        }

        return availableRooms.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public RoomResponse createRoom(RoomRequest request) {
        var hotel = hotelRepo.findById(request.getHotelId())
                .orElseThrow(() -> new RuntimeException("Hotel not found"));

        Room room = Room.builder()
                .hotel(hotel)
                .roomNumber(request.getRoomNumber())
                .type(request.getType())
                .numberOfBeds(request.getNumberOfBeds())
                .price(request.getPrice())
                .status("AVAILABLE")
                .build();

        Room saved = roomRepo.save(room);
        return mapToResponse(saved);
    }

    private RoomResponse mapToResponse(Room room) {
        return RoomResponse.builder()
                .id(room.getId())
                .hotelName(room.getHotel().getName())
                .roomNumber(room.getRoomNumber())
                .type(room.getType())
                .numberOfBeds(room.getNumberOfBeds())
                .price(room.getPrice())
                .status(room.getStatus())
                .build();
    }
}