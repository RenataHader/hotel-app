package com.hotel.operations.employee;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;

public interface EmployeeRepository extends JpaRepository<Employee, Integer> {
    List<Employee> findAllByHotelId(Integer hotelId);
    Optional<Employee> findByIdAndHotelId(Integer id, Integer hotelId);
    boolean existsByIdAndHotelId(Integer id, Integer hotelId);
    @Query("select distinct e.position from Employee e where e.position is not null order by e.position")
    java.util.List<String> findDistinctPositions();
}
