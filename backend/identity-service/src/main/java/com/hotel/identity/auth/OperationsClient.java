package com.hotel.identity.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class OperationsClient {

    private final WebClient web;

    public OperationsClient(WebClient.Builder builder,
                            @Value("${app.operations.url}") String baseUrl) {
        this.web = builder.baseUrl(baseUrl).build();
    }

    public Integer getHotelIdForEmployee(int employeeId) {
        return web.get()
                .uri("/employees/{id}", employeeId)
                .retrieve()
                .bodyToMono(EmployeeResponse.class)
                .map(EmployeeResponse::hotelId)
                .block();
    }

    public EmployeeResponse getEmployee(int employeeId) {
        return web.get()
                .uri("/employees/{id}", employeeId)
                .retrieve()
                .bodyToMono(EmployeeResponse.class)
                .block();
    }

    public String getPositionForEmployee(int employeeId) {
        EmployeeResponse emp = getEmployee(employeeId);
        return emp != null ? emp.position() : null;
    }

    public record EmployeeResponse(Integer id, Integer hotelId, String position) {}
}
