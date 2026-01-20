package com.hotel.booking.reservation;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;
    private final ReservationRepository reservationRepo;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<ReservationResponse> getAll() {
        return reservationService.getAllReservationsLight();
    }

    @GetMapping("/admin/light")
    @PreAuthorize("hasRole('ADMIN')")
    public Page<ReservationResponse> getAllLight(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        return reservationService.getAllReservationsLightPage(page, size);
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('GUEST')")
    public List<ReservationResponse> getMyReservations() {
        return reservationService.getMyReservations();
    }

    @GetMapping("/hotel")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public List<ReservationResponse> getMyHotelReservations() {
        return reservationService.getHotelReservations();
    }

    @GetMapping("/reserved-ids")
    public List<Integer> getReservedIds(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return reservationRepo.findReservedRoomIds(from, to);
    }

    @PreAuthorize("hasAnyRole('GUEST','EMPLOYEE')")
    @PatchMapping("/{id}/cancel")
    public void cancel(@PathVariable Integer id) {
        reservationService.cancelReservation(id);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public void updateStatus(@PathVariable Integer id, @RequestParam String value) {
        reservationService.updateStatus(id, value);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('GUEST')")
    public ReservationResponse create(@Valid @RequestBody ReservationRequest request) {
        return reservationService.createReservation(request);
    }

    @PostMapping("/quote")
    public ReservationQuoteResponse quote(@Valid @RequestBody ReservationRequest request) {
        return reservationService.quote(request);
    }

    @GetMapping("/my/page")
    @PreAuthorize("hasRole('GUEST')")
    public Page<ReservationResponse> getMyReservationsPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return reservationService.getMyReservationsPage(page, size);
    }

    @GetMapping("/hotel/page")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public Page<ReservationResponse> getMyHotelReservationsPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return reservationService.getHotelReservationsPage(page, size);
    }
    @GetMapping("/rooms/{roomId}/has-future")
    public boolean hasFuture(
            @PathVariable Integer roomId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from
    ) {
        return reservationRepo.existsFutureForRoom(roomId, from);
    }

    @GetMapping("/hotel/checkins")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public List<ReservationResponse> getHotelCheckins(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        LocalDate d = (date != null) ? date : LocalDate.now();
        return reservationService.getHotelCheckinsForDate(d);
    }

    @GetMapping("/hotel/checkouts")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public List<ReservationResponse> getHotelCheckouts(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        LocalDate d = (date != null) ? date : LocalDate.now();
        return reservationService.getHotelCheckoutsForDate(d);
    }

}
