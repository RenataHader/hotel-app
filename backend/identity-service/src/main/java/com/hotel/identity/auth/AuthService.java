package com.hotel.identity.auth;

import com.hotel.identity.account.Account;
import com.hotel.identity.account.AccountRepository;
import com.hotel.security.JwtService;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@Service
public class AuthService {

    private final AccountRepository repo;
    private final PasswordEncoder encoder;
    private final JwtService jwtService;
    private final OperationsClient operationsClient;
    private final BookingClient bookingClient;

    public AuthService(AccountRepository repo, PasswordEncoder encoder, JwtService jwtService,
                       OperationsClient operationsClient, BookingClient bookingClient) {
        this.repo = repo;
        this.encoder = encoder;
        this.jwtService = jwtService;
        this.operationsClient = operationsClient;
        this.bookingClient = bookingClient;
    }

    public AuthResponse login(LoginRequest req) {
        Account acc = repo.findByEmail(req.email())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!encoder.matches(req.password(), acc.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        Map<String, Object> claims = new HashMap<>();
        claims.put("role", acc.getRole());
        claims.put("accountId", acc.getId());

        if (acc.getEmployeeId() != null) {
            Integer hotelId = operationsClient.getHotelIdForEmployee(acc.getEmployeeId());
            claims.put("hotelId", hotelId);
        }

        if (acc.getGuestId() != null) {
            claims.put("guestId", acc.getGuestId());
        }

        String token = jwtService.generateToken(acc.getEmail(), claims);

        return new AuthResponse(
                token,
                "Bearer",
                jwtService.expiresInSeconds(),
                acc.getId(),
                acc.getEmail(),
                acc.getRole()
        );
    }

    private void validateXor(Integer employeeId, Integer guestId) {
        boolean e = employeeId != null;
        boolean g = guestId != null;
        if (e == g) {
            throw new IllegalArgumentException("Exactly one of employeeId or guestId must be provided");
        }
    }

    private Integer accGetIdSafe(Integer id) {
        if (id == null) throw new IllegalStateException("Account ID is null (did you save the entity before token?)");
        return id;
    }

    @Transactional
    public AuthResponse registerGuest(RegisterGuestRequest req) {
        if (repo.existsByEmail(req.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        Integer guestId = bookingClient.createGuest(
                new BookingClient.CreateGuestRequest(
                        req.firstName(),
                        req.lastName(),
                        req.phoneNumber(),
                        req.documentNumber()
                )
        );

        Account acc = Account.builder()
                .email(req.email())
                .password(encoder.encode(req.password()))
                .role("GUEST")
                .guestId(guestId)
                .employeeId(null)
                .build();

        acc = repo.save(acc);

        String token = jwtService.generateToken(acc.getEmail(), Map.of(
                "role", acc.getRole(),
                "accountId", acc.getId(),
                "guestId", guestId
        ));

        return new AuthResponse(token, "Bearer", jwtService.expiresInSeconds(), acc.getId(), acc.getEmail(), acc.getRole());
    }

    @Transactional
    public AuthResponse registerEmployee(RegisterEmployeeRequest req) {
        if (repo.existsByEmail(req.email())) {
            throw new IllegalArgumentException("Email already exists");
        }

        Account acc = Account.builder()
                .email(req.email())
                .password(encoder.encode(req.password()))
                .role("EMPLOYEE")
                .employeeId(req.employeeId())
                .guestId(null)
                .build();

        acc = repo.save(acc);

        Integer hotelId = operationsClient.getHotelIdForEmployee(acc.getEmployeeId());

        String token = jwtService.generateToken(acc.getEmail(), Map.of(
                "role", acc.getRole(),
                "accountId", acc.getId(),
                "hotelId", hotelId
        ));

        return new AuthResponse(token, "Bearer", jwtService.expiresInSeconds(), acc.getId(), acc.getEmail(), acc.getRole());
    }


}
