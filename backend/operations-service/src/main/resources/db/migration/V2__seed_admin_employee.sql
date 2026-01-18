INSERT INTO pracownik (id_pracownika, imie, nazwisko, stanowisko, data_zatrudnienia, nr_telefonu, id_hotelu)
VALUES (1, 'Admin', 'Root', 'Administrator', CURRENT_DATE, '000000000', 1)
ON CONFLICT (id_pracownika) DO NOTHING;

INSERT INTO pracownik (id_pracownika, imie, nazwisko, stanowisko, data_zatrudnienia, nr_telefonu, id_hotelu)
VALUES (2, 'Jan', 'Kowalski', 'Recepcjonista', CURRENT_DATE, '111222333', 1)
ON CONFLICT (id_pracownika) DO NOTHING;

SELECT setval(pg_get_serial_sequence('pracownik', 'id_pracownika'), (SELECT MAX(id_pracownika) FROM pracownik));