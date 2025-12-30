package com.hotel.catalog.room;

import com.hotel.catalog.hotel.Hotel;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Pokoj {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pokoju")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "id_hotelu", nullable = false)
    private Hotel hotel;

    @Column(name = "nr_pokoju", nullable = false)
    private String roomNumber;

    @Column(name = "typ", nullable = false)
    private String type;

    @Column(name = "liczba_lozek")
    private Integer numberOfBeds;

    @Column(name = "cena", nullable = false)
    private BigDecimal price;

    @Column(name = "opis")
    private String description;

    @Column(nullable = false)
    private String status;
}