package com.hotel.catalog.hotel;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "hotel")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Hotel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_hotelu")
    private Integer id;

    @Column(name = "nazwa", nullable = false)
    private String name;

    @Column(name = "adres", nullable = false)
    private String address;
}
