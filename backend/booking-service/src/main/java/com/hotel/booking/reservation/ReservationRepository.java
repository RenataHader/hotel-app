package com.hotel.booking.reservation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Integer> {

    List<Reservation> findAllByGuestId(Integer guestId);

    List<Reservation> findAllByHotelId(Integer hotelId);

    @Query("SELECT r.roomId FROM Reservation r WHERE (r.checkInDate < :to AND r.checkOutDate > :from)")
    List<Integer> findReservedRoomIds(@Param("from") LocalDate from, @Param("to") LocalDate to);

    boolean existsByRoomIdAndCheckInDateBeforeAndCheckOutDateAfter(Integer roomId, LocalDate checkOutDate, LocalDate checkInDate);
}