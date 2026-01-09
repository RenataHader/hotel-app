package com.hotel.catalog.room;

import com.hotel.catalog.hotel.HotelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

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

    @Value("${app.services.booking.base-url:http://localhost:8081}")
    private String bookingBaseUrl;

    public List<RoomResponse> getAllRooms() {
        return roomRepo.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<RoomResponse> getAvailableRooms(Integer hotelId, LocalDate from, LocalDate to) {
        String url = bookingBaseUrl + "/api/reservations/reserved-ids?from=" + from + "&to=" + to;

        List<Integer> reservedIds;
        try {
            Integer[] response = restTemplate.getForObject(url, Integer[].class);
            reservedIds = (response != null) ? Arrays.asList(response) : List.of();
        } catch (RestClientException e) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Nie można sprawdzić dostępności pokoi (booking-service niedostępny). Spróbuj ponownie za chwilę.",
                    e
            );
        }

        List<Room> availableRooms = reservedIds.isEmpty()
                ? roomRepo.findAllByHotel_Id(hotelId)
                : roomRepo.findAllByHotel_IdAndIdNotIn(hotelId, reservedIds);

        return availableRooms.stream().map(this::mapToResponse).collect(Collectors.toList());
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

    public RoomResponse getRoomById(Integer id) {
        Room room = roomRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Room not found"));
        return mapToResponse(room);
    }

    public List<RoomResponse> searchRooms(Integer hotelId, String type) {
        List<Room> rooms = (type == null || type.isBlank())
                ? roomRepo.findAllByHotel_Id(hotelId)
                : roomRepo.findAllByHotel_IdAndTypeIgnoreCase(hotelId, type);

        return rooms.stream().map(this::mapToResponse).toList();
    }

    private RoomResponse mapToResponse(Room room) {
        return RoomResponse.builder()
                .id(room.getId())
                .hotelId(room.getHotel().getId())
                .hotelName(room.getHotel().getName())
                .roomNumber(room.getRoomNumber())
                .type(room.getType())
                .numberOfBeds(room.getNumberOfBeds())
                .price(room.getPrice())
                .status(room.getStatus())
                .build();
    }
}
