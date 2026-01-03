package com.hotel.identity.account;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "konto")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Account {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_konta")
    private Integer id;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "haslo", nullable = false)
    private String password;

    @Column(name = "rola", nullable = false)
    private String role;

    @Column(name = "id_pracownika")
    private Integer employeeId;

    @Column(name = "id_goscia")
    private Integer guestId;
}
