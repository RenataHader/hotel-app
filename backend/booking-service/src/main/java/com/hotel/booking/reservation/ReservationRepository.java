package com.hotel.booking.reservation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;

public interface ReservationRepository extends JpaRepository<Reservation, Integer> {
    boolean existsByRoomIdAndCheckInDateBeforeAndCheckOutDateAfter(Integer roomId, LocalDate checkOutDate, LocalDate checkInDate);
}
