package com.hotel.booking.reservation;

import com.hotel.booking.guest.Guest;
import com.hotel.booking.guest.GuestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepo;
    private final GuestRepository guestRepo;

    private Guest getAuthenticatedGuest() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return guestRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated guest not found"));
    }

    public List<ReservationResponse> getAllReservations() {
        return reservationRepo.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ReservationResponse> getMyReservations() {
        Guest guest = getAuthenticatedGuest();
        return reservationRepo.findAllByGuestId(guest.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ReservationResponse> getHotelReservations(Integer hotelId) {
        return reservationRepo.findAllByHotelId(hotelId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void cancelReservation(Integer id) {
        if (!reservationRepo.existsById(id)) {
            throw new RuntimeException("Reservation not found");
        }
        reservationRepo.deleteById(id);
    }

    @Transactional
    public void updateStatus(Integer id, String newStatus) {
        Reservation reservation = reservationRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));
        reservation.setStatus(newStatus);
        reservationRepo.save(reservation);
    }

    @Transactional
    public ReservationResponse createReservation(ReservationRequest request) {
        Guest guest = getAuthenticatedGuest();

        boolean isOccupied = reservationRepo.existsByRoomIdAndCheckInDateBeforeAndCheckOutDateAfter(
                request.getRoomId(), request.getCheckOutDate(), request.getCheckInDate());

        if (isOccupied) {
            throw new RuntimeException("Room is already booked for these dates!");
        }

        Reservation reservation = Reservation.builder()
                .guest(guest)
                .hotelId(request.getHotelId())
                .hotelName(request.getHotelName())
                .roomId(request.getRoomId())
                .roomNumber(request.getRoomNumber())
                .checkInDate(request.getCheckInDate())
                .checkOutDate(request.getCheckOutDate())
                .price(request.getPrice())
                .status("CREATED")
                .build();

        Reservation saved = reservationRepo.save(reservation);
        return mapToResponse(saved);
    }

    private ReservationResponse mapToResponse(Reservation reservation) {
        return ReservationResponse.builder()
                .id(reservation.getId())
                .guestFullName(reservation.getGuest().getFirstName() + " " + reservation.getGuest().getLastName())
                .hotelId(reservation.getHotelId())
                .hotelName(reservation.getHotelName())
                .roomId(reservation.getRoomId())
                .roomNumber(reservation.getRoomNumber())
                .checkInDate(reservation.getCheckInDate())
                .checkOutDate(reservation.getCheckOutDate())
                .price(reservation.getPrice())
                .status(reservation.getStatus())
                .build();
    }
}