package com.hotel.identity.account;

import com.hotel.identity.auth.OperationsClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountService {

    private final AccountRepository repo;
    private final OperationsClient operationsClient;

    public AccountService(AccountRepository repo, OperationsClient operationsClient) {
        this.repo = repo;
        this.operationsClient = operationsClient;
    }

    @Transactional
    public void deleteByEmployeeId(Integer employeeId) {
        if (employeeId == null) return;
        repo.deleteByEmployeeId(employeeId);
    }

    public AccountResponse getByEmail(String email) {
        Account acc = repo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        Integer hotelId = null;
        String position = null;

        if (acc.getEmployeeId() != null) {
            try {
                var emp = operationsClient.getEmployee(acc.getEmployeeId());
                if (emp != null) {
                    hotelId = emp.hotelId();
                    position = emp.position();
                }
            } catch (Exception ignored) {

            }
        }

        return new AccountResponse(
                acc.getId(),
                acc.getEmail(),
                acc.getRole(),
                acc.getEmployeeId(),
                acc.getGuestId(),
                hotelId,
                position
        );
    }

}
