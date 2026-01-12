-- Tworzy pracownika-admina o stałym ID=1 (dla dev)
INSERT INTO pracownik (id_pracownika, imie, nazwisko, stanowisko, data_zatrudnienia, nr_telefonu, id_hotelu)
VALUES (1, 'Admin', 'Root', 'Administrator', CURRENT_DATE, '000000000', 1)
ON CONFLICT (id_pracownika) DO NOTHING;

-- Ustaw sekwencję, żeby kolejne inserty nie waliły konfliktem
SELECT setval(pg_get_serial_sequence('pracownik', 'id_pracownika'),
              (SELECT COALESCE(MAX(id_pracownika), 1) FROM pracownik));
