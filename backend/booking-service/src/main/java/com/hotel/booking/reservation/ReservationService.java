package com.hotel.booking.reservation;

import com.hotel.booking.guest.GuestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepo;
    private final GuestRepository guestRepo;

    public List<ReservationResponse> getAllReservations() {
        return reservationRepo.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ReservationResponse createReservation(ReservationRequest request) {
        var guest = guestRepo.findById(request.getGuestId())
                .orElseThrow(() -> new RuntimeException("Guest not found"));

        Reservation reservation = Reservation.builder()
                .guest(guest)
                .hotelId(request.getHotelId())
                .roomId(request.getRoomId())
                .checkInDate(request.getCheckInDate())
                .checkOutDate(request.getCheckOutDate())
                .status("CREATED")
                .build();

        Reservation saved = reservationRepo.save(reservation);
        return mapToResponse(saved);
    }

    private ReservationResponse mapToResponse(Reservation reservation) {
        return ReservationResponse.builder()
                .id(reservation.getId())
                .guestFullName(reservation.getGuest().getFirstName() + " " + reservation.getGuest().getLastName())
                .roomId(reservation.getRoomId())
                .checkInDate(reservation.getCheckInDate())
                .checkOutDate(reservation.getCheckOutDate())
                .status(reservation.getStatus())
                .build();
    }
}