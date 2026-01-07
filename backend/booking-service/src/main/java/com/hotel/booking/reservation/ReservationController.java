package com.hotel.booking.reservation;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;
    private final ReservationRepository reservationRepo;

    @GetMapping
    public List<ReservationResponse> getAll() {
        return reservationService.getAllReservations();
    }

    @GetMapping("/my")
    public List<ReservationResponse> getMyReservations() {
        return reservationService.getMyReservations();
    }

    @GetMapping("/hotel")
    public List<ReservationResponse> getByHotel(@RequestParam Integer hotelId) {
        return reservationService.getHotelReservations(hotelId);
    }

    @GetMapping("/reserved-ids")
    public List<Integer> getReservedIds(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return reservationRepo.findReservedRoomIds(from, to);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(@PathVariable Integer id) {
        reservationService.cancelReservation(id);
    }

    @PatchMapping("/{id}/status")
    public void updateStatus(@PathVariable Integer id, @RequestParam String value) {
        reservationService.updateStatus(id, value);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReservationResponse create(@Valid @RequestBody ReservationRequest request) {
        return reservationService.createReservation(request);
    }
}