package com.hotel.identity.account;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/accounts")
public class AccountController {

    private final AccountService service;

    public AccountController(AccountService service) {
        this.service = service;
    }

    @GetMapping("/me")
    public AccountResponse me(Authentication auth) {
        // auth.getName() == email (subject z JWT)
        return service.getByEmail(auth.getName());
    }
}