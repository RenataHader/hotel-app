package com.hotel.operations.booking;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/operations/reservations")
@RequiredArgsConstructor
public class BookingStatusController {

    private final BookingStatusService bookingStatusService;

    @PreAuthorize("hasAnyRole('EMPLOYEE','ADMIN')")
    @PatchMapping("/{id}/checkin")
    @ResponseStatus(HttpStatus.OK)
    public void checkIn(@PathVariable Integer id,
                        @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String auth) {
        bookingStatusService.checkIn(id, auth);
    }

    @PreAuthorize("hasAnyRole('EMPLOYEE','ADMIN')")
    @PatchMapping("/{id}/checkout")
    @ResponseStatus(HttpStatus.OK)
    public void checkOut(@PathVariable Integer id,
                         @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String auth) {
        bookingStatusService.checkOut(id, auth);
    }
}
