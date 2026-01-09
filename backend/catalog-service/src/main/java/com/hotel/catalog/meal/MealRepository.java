package com.hotel.catalog.meal;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MealRepository extends JpaRepository<Meal, Integer> {
    Optional<Meal> findByTypeIgnoreCase(String type);
}