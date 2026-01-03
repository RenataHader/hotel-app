package com.hotel.booking.reservation;

import com.hotel.booking.guest.Guest;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "rezerwacja")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Reservation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "nr_rezerwacji")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "id_goscia", nullable = false)
    private Guest guest;

    @Column(name = "id_hotelu", nullable = false)
    private Integer hotelId;

    @Column(name = "id_pokoju", nullable = false)
    private Integer roomId;

    @Column(name = "data_zameldowania", nullable = false)
    private LocalDate checkInDate;

    @Column(name = "data_wymeldowania", nullable = false)
    private LocalDate checkOutDate;

    @Column(nullable = false)
    private String status;
}