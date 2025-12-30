package com.hotel.operations.employee;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository repo;

    public List<EmployeeResponse> getAll() {
        return repo.findAll().stream().map(this::toResponse).toList();
    }

    public EmployeeResponse getById(Integer id) {
        Employee e = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));
        return toResponse(e);
    }

    public EmployeeResponse create(EmployeeCreateRequest req) {
        Employee e = Employee.builder()
                .firstName(req.firstName())
                .lastName(req.lastName())
                .position(req.position())
                .hireDate(req.hireDate())
                .phoneNumber(req.phoneNumber())
                .hotelId(req.hotelId())
                .build();

        return toResponse(repo.save(e));
    }

    public EmployeeResponse update(Integer id, EmployeeUpdateRequest req) {
        Employee e = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        e.setFirstName(req.firstName());
        e.setLastName(req.lastName());
        e.setPosition(req.position());
        e.setHireDate(req.hireDate());
        e.setPhoneNumber(req.phoneNumber());
        e.setHotelId(req.hotelId());

        return toResponse(repo.save(e));
    }

    public void delete(Integer id) {
        if (!repo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found");
        }
        repo.deleteById(id);
    }

    private EmployeeResponse toResponse(Employee e) {
        return new EmployeeResponse(
                e.getId(),
                e.getFirstName(),
                e.getLastName(),
                e.getPosition(),
                e.getHireDate(),
                e.getPhoneNumber(),
                e.getHotelId()
        );
    }
}
