package com.hotel.catalog.meal;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "wyzywienie")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Wyzywienie {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_wyzywienia")
    private Integer id;

    @Column(name = "typ", nullable = false)
    private String type;

    @Column(name = "cena", nullable = false)
    private BigDecimal price;
}
