-- V2__catalog_seed.sql
-- Minimalne dane testowe: 4 hotele, pokoje, wyżywienie, usługi
-- Idempotentne (bez duplikatów)

-- 1) HOTELE (4 szt.)
INSERT INTO hotel (nazwa, adres)
SELECT 'Dach w chmurach', 'ul. Widokowa 7, 58-540 Karpacz'
WHERE NOT EXISTS (SELECT 1 FROM hotel WHERE nazwa = 'Dach w chmurach');

INSERT INTO hotel (nazwa, adres)
SELECT 'Dach nad palma', 'ul. Palmiarnia 3, 60-809 Poznań'
WHERE NOT EXISTS (SELECT 1 FROM hotel WHERE nazwa = 'Dach nad palma');

INSERT INTO hotel (nazwa, adres)
SELECT 'Dach przy żaglu', 'ul. Marina 12, 81-340 Gdynia'
WHERE NOT EXISTS (SELECT 1 FROM hotel WHERE nazwa = 'Dach przy żaglu');

INSERT INTO hotel (nazwa, adres)
SELECT 'Dach w lesie', 'ul. Leśna 22, 17-230 Białowieża'
WHERE NOT EXISTS (SELECT 1 FROM hotel WHERE nazwa = 'Dach w lesie');


-- 2) POKOJE (po kilka dla każdego hotelu)
-- Dach w chmurach
WITH h AS (
    SELECT id_hotelu FROM hotel WHERE nazwa = 'Dach w chmurach' LIMIT 1
)
INSERT INTO pokoj (id_hotelu, nr_pokoju, typ, liczba_lozek, cena, status, opis)
SELECT h.id_hotelu, v.nr_pokoju, v.typ, v.liczba_lozek, v.cena, v.status, v.opis
FROM h
JOIN (VALUES
    ('101', 'Single', 1, 190.00::DECIMAL(10,2), 'AVAILABLE', 'Widok na góry'),
    ('102', 'Double', 2, 320.00::DECIMAL(10,2), 'AVAILABLE', 'Balkon, wysoki standard'),
    ('201', 'Suite',  3, 560.00::DECIMAL(10,2), 'AVAILABLE', 'Apartament z tarasem')
) AS v(nr_pokoju, typ, liczba_lozek, cena, status, opis) ON TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM pokoj p
    WHERE p.id_hotelu = h.id_hotelu AND p.nr_pokoju = v.nr_pokoju
);

-- Dach nad palma
WITH h AS (
    SELECT id_hotelu FROM hotel WHERE nazwa = 'Dach nad palma' LIMIT 1
)
INSERT INTO pokoj (id_hotelu, nr_pokoju, typ, liczba_lozek, cena, status, opis)
SELECT h.id_hotelu, v.nr_pokoju, v.typ, v.liczba_lozek, v.cena, v.status, v.opis
FROM h
JOIN (VALUES
    ('101', 'Single', 1, 170.00::DECIMAL(10,2), 'AVAILABLE', 'Blisko palmiarni'),
    ('102', 'Double', 2, 290.00::DECIMAL(10,2), 'AVAILABLE', 'Jasny pokój, klimatyzacja'),
    ('201', 'Suite',  3, 520.00::DECIMAL(10,2), 'AVAILABLE', 'Apartament rodzinny')
) AS v(nr_pokoju, typ, liczba_lozek, cena, status, opis) ON TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM pokoj p
    WHERE p.id_hotelu = h.id_hotelu AND p.nr_pokoju = v.nr_pokoju
);

-- Dach przy żaglu
WITH h AS (
    SELECT id_hotelu FROM hotel WHERE nazwa = 'Dach przy żaglu' LIMIT 1
)
INSERT INTO pokoj (id_hotelu, nr_pokoju, typ, liczba_lozek, cena, status, opis)
SELECT h.id_hotelu, v.nr_pokoju, v.typ, v.liczba_lozek, v.cena, v.status, v.opis
FROM h
JOIN (VALUES
    ('101', 'Single', 1, 210.00::DECIMAL(10,2), 'AVAILABLE', 'Blisko mariny'),
    ('102', 'Double', 2, 350.00::DECIMAL(10,2), 'AVAILABLE', 'Widok na port'),
    ('201', 'Suite',  4, 690.00::DECIMAL(10,2), 'AVAILABLE', 'Duży apartament dla grupy')
) AS v(nr_pokoju, typ, liczba_lozek, cena, status, opis) ON TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM pokoj p
    WHERE p.id_hotelu = h.id_hotelu AND p.nr_pokoju = v.nr_pokoju
);

-- Dach w lesie
WITH h AS (
    SELECT id_hotelu FROM hotel WHERE nazwa = 'Dach w lesie' LIMIT 1
)
INSERT INTO pokoj (id_hotelu, nr_pokoju, typ, liczba_lozek, cena, status, opis)
SELECT h.id_hotelu, v.nr_pokoju, v.typ, v.liczba_lozek, v.cena, v.status, v.opis
FROM h
JOIN (VALUES
    ('101', 'Single', 1, 160.00::DECIMAL(10,2), 'AVAILABLE', 'Cisza i spokój'),
    ('102', 'Double', 2, 270.00::DECIMAL(10,2), 'AVAILABLE', 'Widok na las'),
    ('201', 'Suite',  3, 480.00::DECIMAL(10,2), 'AVAILABLE', 'Rodzinny apartament')
) AS v(nr_pokoju, typ, liczba_lozek, cena, status, opis) ON TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM pokoj p
    WHERE p.id_hotelu = h.id_hotelu AND p.nr_pokoju = v.nr_pokoju
);


-- 3) WYŻYWIENIE (w tym Brak)
INSERT INTO wyzywienie (typ, cena)
SELECT 'Brak', 0.00
WHERE NOT EXISTS (SELECT 1 FROM wyzywienie WHERE LOWER(typ) = LOWER('Brak'));

INSERT INTO wyzywienie (typ, cena)
SELECT 'Śniadanie', 40.00
WHERE NOT EXISTS (SELECT 1 FROM wyzywienie WHERE LOWER(typ) = LOWER('Śniadanie'));

INSERT INTO wyzywienie (typ, cena)
SELECT 'All Inclusive', 150.00
WHERE NOT EXISTS (SELECT 1 FROM wyzywienie WHERE LOWER(typ) = LOWER('All Inclusive'));


-- 4) USŁUGI
INSERT INTO usluga (nazwa, billing_type, cena)
SELECT 'Siłownia', 'PER_PERSON_PER_DAY', 20.00
WHERE NOT EXISTS (SELECT 1 FROM usluga WHERE nazwa='Siłownia');

INSERT INTO usluga (nazwa, billing_type, cena)
SELECT 'Basen', 'PER_PERSON_PER_DAY', 25.00
WHERE NOT EXISTS (SELECT 1 FROM usluga WHERE nazwa='Basen');

INSERT INTO usluga (nazwa, billing_type, cena)
SELECT 'Sala zabaw dla dzieci', 'PER_PERSON_PER_DAY', 10.00
WHERE NOT EXISTS (SELECT 1 FROM usluga WHERE nazwa='Sala zabaw dla dzieci');

INSERT INTO usluga (nazwa, billing_type, cena)
SELECT 'SPA / Sauna', 'PER_PERSON_PER_DAY', 60.00
WHERE NOT EXISTS (SELECT 1 FROM usluga WHERE nazwa='SPA / Sauna');

INSERT INTO usluga (nazwa, billing_type, cena)
SELECT 'Parking', 'PER_DAY', 30.00
WHERE NOT EXISTS (SELECT 1 FROM usluga WHERE nazwa='Parking');

INSERT INTO usluga (nazwa, billing_type, cena)
SELECT 'Transfer z lotniska', 'PER_STAY', 150.00
WHERE NOT EXISTS (SELECT 1 FROM usluga WHERE nazwa='Transfer z lotniska');
