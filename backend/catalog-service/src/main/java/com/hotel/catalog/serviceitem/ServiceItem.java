package com.hotel.catalog.serviceitem;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "usluga")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ServiceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_uslugi")
    private Integer id;

    @Column(name = "nazwa", nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "typ_rozliczenia", nullable = false)
    private BillingType billingType;

    @Column(name = "cena", nullable = false)
    private BigDecimal price;
}
