package com.hotel.booking.payment;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {
    private final PaymentRepository repo;

    @GetMapping
    public List<Payment> getAll() {
        return repo.findAll();
    }

    @PostMapping
    public Payment create(@RequestBody Payment payment) {
        payment.setId(null);
        return repo.save(payment);
    }
}
