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
    private final BookingClient bookingClient;

    @Value("${app.services.booking.base-url:http://localhost:8081}")
    private String bookingBaseUrl;

    public List<RoomResponse> getAllRooms() {
        return roomRepo.findAllByStatusIgnoreCase("AVAILABLE").stream()
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
                ? roomRepo.findAllByHotel_IdAndStatusIgnoreCase(hotelId, "AVAILABLE")
                : roomRepo.findAllByHotel_IdAndIdNotInAndStatusIgnoreCase(hotelId, reservedIds, "AVAILABLE");

        return availableRooms.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public RoomResponse createRoom(RoomRequest request) {
        var hotel = hotelRepo.findById(request.getHotelId())
                .orElseThrow(() -> new RuntimeException("Hotel not found"));

        String roomNumber = String.valueOf(request.getRoomNumber()).trim();

        if (roomRepo.existsByHotel_IdAndRoomNumber(request.getHotelId(), roomNumber)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Pokój o numerze " + roomNumber + " już istnieje w tym hotelu."
            );
        }

        Room room = Room.builder()
                .hotel(hotel)
                .roomNumber(roomNumber)
                .type(request.getType())
                .numberOfBeds(request.getNumberOfBeds())
                .price(request.getPrice())
                .description(request.getDescription())
                .status("AVAILABLE")
                .build();

        return mapToResponse(roomRepo.save(room));
    }


    public RoomResponse getRoomById(Integer id) {
        Room room = roomRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Room not found"));
        return mapToResponse(room);
    }

    public List<RoomResponse> searchRooms(Integer hotelId, String type) {
        List<Room> rooms = (type == null || type.isBlank())
                ? roomRepo.findAllByHotel_IdAndStatusIgnoreCase(hotelId, "AVAILABLE")
                : roomRepo.findAllByHotel_IdAndTypeIgnoreCaseAndStatusIgnoreCase(hotelId, type, "AVAILABLE");

        return rooms.stream().map(this::mapToResponse).toList();
    }

    public List<String> getRoomTypes(Integer hotelId) {
        List<String> types = (hotelId == null)
                ? roomRepo.findDistinctTypesAll()
                : roomRepo.findDistinctTypesByHotel(hotelId);

        return types.stream()
                .filter(t -> t != null && !t.trim().isBlank())
                .map(String::trim)
                .toList();
    }

    public void deactivateRoom(Integer roomId) {
        Room room = roomRepo.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if ("INACTIVE".equalsIgnoreCase(room.getStatus())) return;

        boolean hasFuture = bookingClient.hasFutureReservations(roomId, LocalDate.now());
        if (hasFuture) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Nie można dezaktywować pokoju – ma przyszłe rezerwacje."
            );
        }

        room.setStatus("INACTIVE");
        roomRepo.save(room);
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
                .description(room.getDescription())
                .build();
    }
}
