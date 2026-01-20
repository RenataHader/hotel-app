package com.hotel.booking.reservation;

import org.springframework.data.jpa.repository.EntityGraph;
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
        SELECT DISTINCT rid
        FROM Reservation r
        JOIN r.roomIds rid
        WHERE r.status <> com.hotel.booking.reservation.ReservationStatus.ANULOWANE
          AND (r.checkInDate < :to AND r.checkOutDate > :from)
    """)
    List<Integer> findReservedRoomIds(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("""
        SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END
        FROM Reservation r
        JOIN r.roomIds rid
        WHERE rid IN :roomIds
          AND r.status <> com.hotel.booking.reservation.ReservationStatus.ANULOWANE
          AND (r.checkInDate < :to AND r.checkOutDate > :from)
    """)
    boolean existsAnyRoomOverlap(
            @Param("roomIds") List<Integer> roomIds,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );

    @Query("""
        SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END
        FROM Reservation r
        JOIN r.roomIds rid
        WHERE rid = :roomId
          AND r.status <> com.hotel.booking.reservation.ReservationStatus.ANULOWANE
          AND r.checkOutDate > :from
    """)
    boolean existsFutureForRoom(@Param("roomId") Integer roomId,
                                @Param("from") LocalDate from);

    @Query("""
      select r from Reservation r
      join fetch r.guest g
    """)
    Page<Reservation> findAllWithGuest(Pageable pageable);

    Page<Reservation> findAllByGuest_Id(Integer guestId, Pageable pageable);
    Page<Reservation> findAllByHotelId(Integer hotelId, Pageable pageable);

    @EntityGraph(attributePaths = {"guest"})
    List<Reservation> findAllByHotelIdAndCheckInDateAndStatusNot(Integer hotelId, LocalDate checkInDate, ReservationStatus status);

    @EntityGraph(attributePaths = {"guest"})
    List<Reservation> findAllByHotelIdAndCheckOutDateAndStatusNot(Integer hotelId, LocalDate checkOutDate, ReservationStatus status);

}
