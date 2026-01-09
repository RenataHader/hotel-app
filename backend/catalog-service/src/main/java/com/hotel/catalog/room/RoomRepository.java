package com.hotel.catalog.room;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Integer> {

    List<Room> findAllByHotel_Id(Integer hotelId);

    List<Room> findAllByHotel_IdAndIdNotIn(Integer hotelId, List<Integer> reservedIds);

    List<Room> findAllByHotel_IdAndTypeIgnoreCase(Integer hotelId, String type);
}
