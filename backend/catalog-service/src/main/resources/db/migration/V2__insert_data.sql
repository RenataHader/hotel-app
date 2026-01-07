INSERT INTO hotel (nazwa, adres) VALUES ('Grand Budapest Hotel', 'ul. Górska 10, Zakopane');

INSERT INTO pokoj (id_hotelu, nr_pokoju, typ, liczba_lozek, cena, status)
VALUES (1, '101', 'Single', 1, 150.00, 'AVAILABLE'),
       (1, '102', 'Double', 2, 280.00, 'AVAILABLE'),
       (1, '201', 'Suite', 3, 500.00, 'AVAILABLE');

INSERT INTO wyzywienie (typ, cena) VALUES ('Śniadanie', 40.00), ('All Inclusive', 150.00);