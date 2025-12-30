package com.hotel.operations.maintenance;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "konserwacja")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Maintenance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_konserwacji")
    private Integer id;

    @Column(name = "data_zgloszenia", nullable = false)
    private LocalDate date;

    @Column(name = "opis")
    private String description;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "czas_trwania")
    private Integer durationInDays;

    @Column(name = "id_pracownika", nullable = false)
    private Integer employeeId;

    @Column(name = "id_pokoju", nullable = false)
    private Integer roomId;
}
