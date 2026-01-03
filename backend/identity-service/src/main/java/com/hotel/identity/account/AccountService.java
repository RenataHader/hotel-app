package com.hotel.identity.account;

import org.springframework.stereotype.Service;

@Service
public class AccountService {

    private final AccountRepository repo;

    public AccountService(AccountRepository repo) {
        this.repo = repo;
    }

    public AccountResponse getByEmail(String email) {
        Account acc = repo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        return new AccountResponse(
                acc.getId(),
                acc.getEmail(),
                acc.getRole(),
                acc.getEmployeeId(),
                acc.getGuestId()
        );
    }
}
