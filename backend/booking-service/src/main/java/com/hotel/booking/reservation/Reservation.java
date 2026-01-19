package com.hotel.booking.reservation;

import com.hotel.booking.guest.Guest;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

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

    @Column(name = "liczba_gosci", nullable = false)
    private Integer guestCount;

    @Column(name = "id_wyzywienia", nullable = false)
    private Integer mealId;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "rezerwacja_pokoje",
            joinColumns = @JoinColumn(name = "nr_rezerwacji")
    )
    @Column(name = "id_pokoju")
    @OrderColumn(name = "room_order")
    @Builder.Default
    private List<Integer> roomIds = new ArrayList<>();

    @Column(name = "data_zameldowania", nullable = false)
    private LocalDate checkInDate;

    @Column(name = "data_wymeldowania", nullable = false)
    private LocalDate checkOutDate;


    @Column(name = "kwota", nullable = false)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ReservationStatus status;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "rezerwacja_uslugi",
            joinColumns = @JoinColumn(name = "nr_rezerwacji")
    )
    @Column(name = "id_uslugi")
    @OrderColumn(name = "service_order")
    @Builder.Default
    private List<Integer> serviceIds = new ArrayList<>();
}
