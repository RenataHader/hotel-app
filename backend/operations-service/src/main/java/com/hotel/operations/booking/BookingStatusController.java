package com.hotel.operations.booking;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/operations/reservations")
@RequiredArgsConstructor
public class BookingStatusController {

    private final BookingStatusService bookingStatusService;

    @PatchMapping("/{id}/checkin")
    @ResponseStatus(HttpStatus.OK)
    public void checkIn(@PathVariable Integer id) {
        bookingStatusService.checkIn(id);
    }

    @PatchMapping("/{id}/checkout")
    @ResponseStatus(HttpStatus.OK)
    public void checkOut(@PathVariable Integer id) {
        bookingStatusService.checkOut(id);
    }
}