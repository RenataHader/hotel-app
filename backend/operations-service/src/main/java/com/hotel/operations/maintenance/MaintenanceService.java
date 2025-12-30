package com.hotel.operations.maintenance;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MaintenanceService {

    private final MaintenanceRepository repo;

    public List<MaintenanceResponse> getAll() {
        return repo.findAll().stream().map(this::toResponse).toList();
    }

    public MaintenanceResponse getById(Integer id) {
        Maintenance m = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Maintenance not found"));
        return toResponse(m);
    }

    public MaintenanceResponse create(MaintenanceCreateRequest req) {
        Maintenance m = Maintenance.builder()
                .date(req.date())
                .description(req.description())
                .status(req.status())
                .durationInDays(req.durationInDays())
                .employeeId(req.employeeId())
                .roomId(req.roomId())
                .build();

        return toResponse(repo.save(m));
    }

    public MaintenanceResponse update(Integer id, MaintenanceUpdateRequest req) {
        Maintenance m = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Maintenance not found"));

        m.setDate(req.date());
        m.setDescription(req.description());
        m.setStatus(req.status());
        m.setDurationInDays(req.durationInDays());
        m.setEmployeeId(req.employeeId());
        m.setRoomId(req.roomId());

        return toResponse(repo.save(m));
    }

    public void delete(Integer id) {
        if (!repo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Maintenance not found");
        }
        repo.deleteById(id);
    }

    private MaintenanceResponse toResponse(Maintenance m) {
        return new MaintenanceResponse(
                m.getId(),
                m.getDate(),
                m.getDescription(),
                m.getStatus(),
                m.getDurationInDays(),
                m.getEmployeeId(),
                m.getRoomId()
        );
    }
}