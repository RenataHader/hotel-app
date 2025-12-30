package com.hotel.booking.hotel;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Rezerwacja {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "nr_rezerwacji")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "id_goscia", nullable = false)
    private Gosc gosc;

    @Column(name = "id_hotelu", nullable = false)
    private Long hotelId;

    @Column(name = "id_pokoju", nullable = false)
    private Long roomId;

    @Column(name = "data_zameldowania", nullable = false)
    private LocalDate checkInDate;

    @Column(name = "data_wymeldowania", nullable = false)
    private LocalDate checkOutDate;

    @Column(nullable = false)
    private String status;
}