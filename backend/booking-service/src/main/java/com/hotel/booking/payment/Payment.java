package com.hotel.booking.payment;

import com.hotel.booking.reservation.Reservation;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "platnosc")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_platnosci")
    private Integer id;

    @OneToOne
    @JoinColumn(name = "nr_rezerwacji", nullable = false)
    private Reservation reservation;

    @Column(name = "kwota", nullable = false)
    private BigDecimal amount;

    @Column(name = "data_platnosci", nullable = false)
    private LocalDateTime paymentDate;

    @Column(name = "metoda_platnosci", nullable = false)
    private String paymentMethod;

    @Column(nullable = false)
    private String status;
}