package com.hotel.operations.employee;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "pracownik")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pracownika")
    private Integer id;

    @Column(name = "imie", nullable = false)
    private String firstName;

    @Column(name = "nazwisko", nullable = false)
    private String lastName;

    @Column(name = "stanowisko", nullable = false)
    private String position;

    @Column(name = "data_zatrudnienia", nullable = false)
    private LocalDate hireDate;

    @Column(name = "nr_telefonu")
    private String phoneNumber;

    @Column(name = "id_hotelu", nullable = false)
    private Integer hotelId;
}
