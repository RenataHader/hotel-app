package com.hotel.booking.reservation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ReservationRepository extends JpaRepository<Reservation, Integer> {

    List<Reservation> findAllByGuest_IdOrderByCheckInDateDesc(Integer guestId);

    List<Reservation> findAllByHotelIdOrderByCheckInDateDesc(Integer hotelId);

    Optional<Reservation> findByIdAndGuest_Id(Integer id, Integer guestId);

    @Query("""
    SELECT DISTINCT COALESCE(rid, r.roomId)
    FROM Reservation r
    LEFT JOIN r.roomIds rid
    WHERE r.status <> com.hotel.booking.reservation.ReservationStatus.CANCELLED
      AND (r.checkInDate < :to AND r.checkOutDate > :from)
      AND (rid IS NOT NULL OR r.roomId IS NOT NULL)
    """)
    List<Integer> findReservedRoomIds(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("""
    SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END
    FROM Reservation r
    LEFT JOIN r.roomIds rid
    WHERE (rid IN :roomIds OR r.roomId IN :roomIds)
        AND r.status <> com.hotel.booking.reservation.ReservationStatus.CANCELLED
        AND (r.checkInDate < :to AND r.checkOutDate > :from)
    """)
    boolean existsAnyRoomOverlap(
            @Param("roomIds") List<Integer> roomIds,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );


    Page<Reservation> findAllByGuest_Id(Integer guestId, Pageable pageable);
    Page<Reservation> findAllByHotelId(Integer hotelId, Pageable pageable);
}
