package com.hotel.catalog.meal;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/catering")
@RequiredArgsConstructor
public class MealController {
    private final MealRepository repo;

    @GetMapping
    public List<Meal> getAll() {
        return repo.findAll();
    }

    @PostMapping
    public Meal create(@RequestBody Meal meal) {
        meal.setId(null);
        return repo.save(meal);
    }
}
