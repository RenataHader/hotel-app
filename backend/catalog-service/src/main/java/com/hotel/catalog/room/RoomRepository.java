package com.hotel.catalog.room;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Integer> {

    List<Room> findAllByHotelIdAndIdNotIn(Integer hotelId, List<Integer> reservedIds);

    List<Room> findAllByHotelId(Integer hotelId);
}