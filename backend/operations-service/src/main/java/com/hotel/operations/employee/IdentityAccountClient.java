package com.hotel.operations.employee;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

@Service
public class IdentityAccountClient {

    private final RestTemplate rest;
    private final String baseUrl;

    public IdentityAccountClient(
            RestTemplateBuilder builder,
            @Value("${app.services.identity.base-url:http://localhost:8083}") String baseUrl
    ) {
        this.rest = builder.build();
        this.baseUrl = baseUrl;
    }

    public void deleteAccountForEmployee(Integer employeeId) {
        if (employeeId == null) return;

        String url = baseUrl + "/accounts/employee/" + employeeId;

        try {
            rest.delete(url);
        } catch (HttpClientErrorException.NotFound ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Identity endpoint not found: " + url,
                    ex
            );
        } catch (RestClientException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Nie udało się usunąć konta pracownika w identity-service",
                    ex
            );
        }
    }
}
