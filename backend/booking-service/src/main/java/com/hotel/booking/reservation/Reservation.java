package com.hotel.booking.reservation;

import com.hotel.booking.guest.Guest;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
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

    @Column(name = "hotel_name")
    private String hotelName;

    @Column(name = "id_pokoju", nullable = false)
    private Integer roomId;

    @Column(name = "room_number")
    private String roomNumber;

    @Column(name = "data_zameldowania", nullable = false)
    private LocalDate checkInDate;

    @Column(name = "data_wymeldowania", nullable = false)
    private LocalDate checkOutDate;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(nullable = false)
    private String status;
}