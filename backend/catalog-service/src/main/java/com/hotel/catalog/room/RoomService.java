package com.hotel.catalog.room;

import com.hotel.catalog.hotel.HotelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomService {
    private final RoomRepository roomRepo;
    private final HotelRepository hotelRepo;

    public List<Room> getAllRooms() {
        return roomRepo.findAll();
    }

    public Room createRoom(RoomRequest request) {
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

        return roomRepo.save(room);
    }
}