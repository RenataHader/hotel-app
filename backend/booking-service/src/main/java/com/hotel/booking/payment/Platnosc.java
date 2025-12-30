package com.hotel.booking.payment;

import com.hotel.booking.reservation.Rezerwacja;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Platnosc {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_platnosci")
    private Long id;

    @OneToOne
    @JoinColumn(name = "nr_rezerwacji", nullable = false)
    private Rezerwacja rezerwacja;

    @Column(name = "kwota", nullable = false)
    private BigDecimal amount;

    @Column(name = "data_platnosci")
    private LocalDateTime paymentDate;

    @Column(name = "metoda_platnosci")
    private String paymentMethod;

    @Column(nullable = false)
    private String status;
}