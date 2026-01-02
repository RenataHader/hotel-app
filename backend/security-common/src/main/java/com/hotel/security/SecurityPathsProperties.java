package com.hotel.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

@ConfigurationProperties(prefix = "app.security")
public class SecurityPathsProperties {
    /**
     * Endpointy dostępne bez JWT, np:
     * /auth/**,/actuator/**,/swagger-ui/**,/v3/api-docs/**
     */
    private List<String> permitAll = new ArrayList<>();

    public List<String> getPermitAll() { return permitAll; }
    public void setPermitAll(List<String> permitAll) { this.permitAll = permitAll; }
}