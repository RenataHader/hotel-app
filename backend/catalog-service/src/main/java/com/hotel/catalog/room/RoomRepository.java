package com.hotel.catalog.room;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoomRepository extends JpaRepository<Room, Integer> {

    List<Room> findAllByHotel_Id(Integer hotelId);

    List<Room> findAllByHotel_IdAndIdNotIn(Integer hotelId, List<Integer> reservedIds);

    List<Room> findAllByHotel_IdAndTypeIgnoreCase(Integer hotelId, String type);

    @Query("select distinct r.type from Room r order by r.type")
    List<String> findDistinctTypesAll();

    @Query("select distinct r.type from Room r where r.hotel.id = :hotelId order by r.type")
    List<String> findDistinctTypesByHotel(@Param("hotelId") Integer hotelId);

    boolean existsByHotel_IdAndRoomNumber(Integer hotelId, String roomNumber);

    List<Room> findAllByStatusIgnoreCase(String status);
    List<Room> findAllByHotel_IdAndStatusIgnoreCase(Integer hotelId, String status);
    List<Room> findAllByHotel_IdAndIdNotInAndStatusIgnoreCase(Integer hotelId, List<Integer> ids, String status);
    List<Room> findAllByHotel_IdAndTypeIgnoreCaseAndStatusIgnoreCase(Integer hotelId, String type, String status);

}
