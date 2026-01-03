package com.hotel.catalog.room;

import com.hotel.catalog.hotel.Hotel;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "pokoj")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pokoju")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "id_hotelu", nullable = false)
    private Hotel hotel;

    @Column(name = "nr_pokoju", nullable = false)
    private String roomNumber;

    @Column(name = "typ", nullable = false)
    private String type;

    @Column(name = "liczba_lozek", nullable = false)
    private Integer numberOfBeds;

    @Column(name = "cena", nullable = false)
    private BigDecimal price;

    @Column(name = "opis")
    private String description;

    @Column(nullable = false)
    private String status;
}