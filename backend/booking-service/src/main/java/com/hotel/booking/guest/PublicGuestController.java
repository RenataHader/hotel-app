package com.hotel.booking.guest;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/public/guests")
@RequiredArgsConstructor
public class PublicGuestController {

    private final GuestRepository repo;

    @PostMapping
    public CreateGuestResponse create(@Valid @RequestBody CreateGuestRequest req) {
        Guest guest = Guest.builder()
                .id(null)
                .firstName(req.firstName())
                .lastName(req.lastName())
                .phoneNumber(req.phoneNumber())
                .documentNumber(req.documentNumber())
                .build();

        Guest saved = repo.save(guest);
        return new CreateGuestResponse(saved.getId());
    }

    public record CreateGuestRequest(
            @NotBlank String firstName,
            @NotBlank String lastName,
            String phoneNumber,
            @NotBlank String documentNumber
    ) {}

    public record CreateGuestResponse(Integer guestId) {}
}
