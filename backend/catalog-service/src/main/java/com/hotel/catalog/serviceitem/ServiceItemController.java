package com.hotel.catalog.serviceitem;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/services")
@RequiredArgsConstructor
public class ServiceItemController {

    private final ServiceItemRepository repo;

    @GetMapping
    public List<ServiceItem> getAll() {
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public ServiceItem getById(@PathVariable Integer id) {
        return repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono usługi id=" + id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ServiceItem create(@RequestBody ServiceItem item) {
        item.setId(null);
        return repo.save(item);
    }
}
