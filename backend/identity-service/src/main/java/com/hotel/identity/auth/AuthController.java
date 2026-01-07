package com.hotel.identity.auth;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService service;

    public AuthController(AuthService service) {
        this.service = service;
    }

    @PostMapping("/register-guest")
    public ResponseEntity<AuthResponse> registerGuest(@Valid @RequestBody RegisterGuestRequest req) {
        return ResponseEntity.ok(service.registerGuest(req));
    }

    @PostMapping("/register-employee")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<AuthResponse> registerEmployee(@Valid @RequestBody RegisterEmployeeRequest req) {
        return ResponseEntity.ok(service.registerEmployee(req));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(service.login(req));
    }
}
