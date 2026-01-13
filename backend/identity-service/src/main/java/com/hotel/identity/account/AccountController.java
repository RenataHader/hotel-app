package com.hotel.identity.account;

import org.springframework.http.HttpStatus;
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
        return service.getByEmail(auth.getName());
    }

    @DeleteMapping("/employee/{employeeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEmployeeAccount(@PathVariable Integer employeeId) {
        service.deleteByEmployeeId(employeeId);
    }

}