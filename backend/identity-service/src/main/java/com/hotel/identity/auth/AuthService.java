package com.hotel.identity.auth;

import com.hotel.identity.account.Account;
import com.hotel.identity.account.AccountRepository;
import com.hotel.security.JwtService;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        validateXor(req.employeeId(), req.guestId());

        if (repo.existsByEmail(req.email())) {
            throw new IllegalArgumentException("Email already exists");
        }

        Account acc = Account.builder()
                .email(req.email())
                .password(encoder.encode(req.password()))
                .role(req.role())
                .employeeId(req.employeeId())
                .guestId(req.guestId())
                .build();

        acc = repo.save(acc);

        String token = jwtService.generateToken(
                acc.getEmail(),
                Map.of(
                        "role", acc.getRole(),
                        "accountId", acc.getId()
                )
        );

        return new AuthResponse(
                token,
                "Bearer",
                jwtService.expiresInSeconds(),
                acc.getId(),
                acc.getEmail(),
                acc.getRole()
        );
    }

    public AuthResponse login(LoginRequest req) {
        Account acc = repo.findByEmail(req.email())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!encoder.matches(req.password(), acc.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        String token = jwtService.generateToken(
                acc.getEmail(),
                Map.of(
                        "role", acc.getRole(),
                        "accountId", acc.getId()
                )
        );

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
        if (e == g) { // oba true albo oba false
            throw new IllegalArgumentException("Exactly one of employeeId or guestId must be provided");
        }
    }

    // zabezpieczenie, gdyby ktoś kiedyś zmienił flow i token był generowany przed save()
    private Integer accGetIdSafe(Integer id) {
        if (id == null) throw new IllegalStateException("Account ID is null (did you save the entity before token?)");
        return id;
    }

    @Transactional
    public AuthResponse registerGuest(RegisterGuestRequest req) {
        if (repo.existsByEmail(req.email())) {
            throw new IllegalArgumentException("Email already exists");
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

        String token = jwtService.generateToken(acc.getEmail(), java.util.Map.of(
                "role", acc.getRole(),
                "accountId", acc.getId()
        ));

        return new AuthResponse(token, "Bearer", jwtService.expiresInSeconds(), acc.getId(), acc.getEmail(), acc.getRole());
    }

    @Transactional
    public AuthResponse registerEmployee(RegisterEmployeeRequest req) {
        if (repo.existsByEmail(req.email())) {
            throw new IllegalArgumentException("Email already exists");
        }

        // tu docelowo: walidacja employeeId (czy istnieje) przez operations-service
        Account acc = Account.builder()
                .email(req.email())
                .password(encoder.encode(req.password()))
                .role(req.role())
                .employeeId(req.employeeId())
                .guestId(null)
                .build();

        acc = repo.save(acc);

        // hotelId najlepiej dociągnąć z operations-service po employeeId
        Integer hotelId = operationsClient.getHotelIdForEmployee(acc.getEmployeeId());

        String token = jwtService.generateToken(acc.getEmail(), Map.of(
                "role", acc.getRole(),
                "accountId", acc.getId(),
                "hotelId", hotelId
        ));

        return new AuthResponse(token, "Bearer", jwtService.expiresInSeconds(), acc.getId(), acc.getEmail(), acc.getRole());
    }


}
