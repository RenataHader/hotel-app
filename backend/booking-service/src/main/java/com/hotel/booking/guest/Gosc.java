package com.hotel.booking.guest;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "gosc")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Gosc {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_goscia")
    private Integer id;

    @Column(name = "imie", nullable = false)
    private String firstName;

    @Column(name = "nazwisko", nullable = false)
    private String lastName;

    @Column(name = "nr_telefonu")
    private String phoneNumber;

    @Column(name = "nr_dokumentu", nullable = false)
    private String documentNumber;
}