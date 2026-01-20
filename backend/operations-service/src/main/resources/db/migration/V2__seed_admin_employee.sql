
INSERT INTO pracownik (id_pracownika, imie, nazwisko, stanowisko, data_zatrudnienia, nr_telefonu, id_hotelu) VALUES
  (1, 'Admin', 'Root', 'Administrator', CURRENT_DATE, '000000000', 1),
  (2, 'Jan', 'Kowalski', 'Recepcjonista', CURRENT_DATE, '111222333', 1),
  (3, 'Anna', 'Nowak', 'Recepcjonista', CURRENT_DATE - 120, '111222334', 1),
  (4, 'Piotr', 'Zielinski', 'Recepcjonista', CURRENT_DATE - 340, '111222335', 1),
  (5, 'Ewa', 'Kaczmarek', 'Sprzatacz', CURRENT_DATE - 200, '111222336', 1),
  (6, 'Pawel', 'Maj', 'Sprzatacz', CURRENT_DATE - 80,  '111222337', 1),
  (7, 'Krzysztof', 'Lewandowski', 'Konserwator', CURRENT_DATE - 500, '111222338', 1),
  (8, 'Alicja', 'Kaminska', 'Konserwator', CURRENT_DATE - 260, '111222339', 1),
  (9, 'Monika', 'Szymanska', 'Sprzatacz', CURRENT_DATE - 30,  '111222340', 1)
ON CONFLICT (id_pracownika) DO NOTHING;

INSERT INTO pracownik (id_pracownika, imie, nazwisko, stanowisko, data_zatrudnienia, nr_telefonu, id_hotelu) VALUES
  (10, 'Tomasz', 'Wojcik', 'Recepcjonista', CURRENT_DATE - 210, '222333444', 2),
  (11, 'Karolina', 'Kowalczyk', 'Recepcjonista', CURRENT_DATE - 90,  '222333445', 2),
  (12, 'Michal', 'Jablonski', 'Recepcjonista', CURRENT_DATE - 420, '222333446', 2),
  (13, 'Agnieszka', 'Piotrowska', 'Sprzatacz', CURRENT_DATE - 150, '222333447', 2),
  (14, 'Adam', 'Grabowski', 'Sprzatacz', CURRENT_DATE - 60,  '222333448', 2),
  (15, 'Patryk', 'Nowicki', 'Konserwator', CURRENT_DATE - 380, '222333449', 2),
  (16, 'Natalia', 'Lis', 'Konserwator', CURRENT_DATE - 240, '222333450', 2),
  (17, 'Barbara', 'Pawlak', 'Sprzatacz', CURRENT_DATE - 20,  '222333451', 2)
ON CONFLICT (id_pracownika) DO NOTHING;

INSERT INTO pracownik (id_pracownika, imie, nazwisko, stanowisko, data_zatrudnienia, nr_telefonu, id_hotelu) VALUES
  (18, 'Mateusz', 'Witkowski', 'Recepcjonista', CURRENT_DATE - 310, '333444555', 3),
  (19, 'Julia', 'Walczak', 'Recepcjonista', CURRENT_DATE - 110, '333444556', 3),
  (20, 'Damian', 'Baran', 'Recepcjonista', CURRENT_DATE - 520, '333444557', 3),
  (21, 'Katarzyna', 'Zawadzka', 'Sprzatacz', CURRENT_DATE - 170, '333444558', 3),
  (22, 'Robert', 'Czarnecki', 'Sprzatacz', CURRENT_DATE - 70,  '333444559', 3),
  (23, 'Marcin', 'Sokolowski', 'Konserwator', CURRENT_DATE - 410, '333444560', 3),
  (24, 'Paulina', 'Urban', 'Konserwator', CURRENT_DATE - 260, '333444561', 3),
  (25, 'Iwona', 'Krupa', 'Sprzatacz', CURRENT_DATE - 25,  '333444562', 3)
ON CONFLICT (id_pracownika) DO NOTHING;

INSERT INTO pracownik (id_pracownika, imie, nazwisko, stanowisko, data_zatrudnienia, nr_telefonu, id_hotelu) VALUES
  (26, 'Lukasz', 'Kubiak', 'Recepcjonista', CURRENT_DATE - 260, '444555666', 4),
  (27, 'Magdalena', 'Slawinska', 'Recepcjonista', CURRENT_DATE - 95,  '444555667', 4),
  (28, 'Jakub', 'Krol', 'Recepcjonista', CURRENT_DATE - 480, '444555668', 4),
  (29, 'Alicja', 'Wieczorek', 'Sprzatacz', CURRENT_DATE - 160, '444555669', 4),
  (30, 'Szymon', 'Zakrzewski', 'Sprzatacz', CURRENT_DATE - 55,  '444555670', 4),
  (31, 'Sebastian', 'Stepien', 'Konserwator', CURRENT_DATE - 430, '444555671', 4),
  (32, 'Weronika', 'Bialek', 'Konserwator', CURRENT_DATE - 280, '444555672', 4),
  (33, 'Elzbieta', 'Jankowska', 'Sprzatacz', CURRENT_DATE - 15,  '444555673', 4)
ON CONFLICT (id_pracownika) DO NOTHING;

-- Ustaw sekwencję pracownik po ręcznych ID
SELECT setval(pg_get_serial_sequence('pracownik', 'id_pracownika'),
              (SELECT COALESCE(MAX(id_pracownika), 1) FROM pracownik));


INSERT INTO konserwacja (id_konserwacji, data_zgloszenia, opis, status, czas_trwania, id_pokoju, id_pracownika)
SELECT
  10000 + (0 * 100) + gs AS id_konserwacji,
  (CURRENT_DATE - ((gs * 3) % 180))::date AS data_zgloszenia,
  CASE (gs % 12)
    WHEN 0 THEN 'Nieszczelnosc kranu w lazience'
    WHEN 1 THEN 'Wymiana zarowki w lampie sufitowej'
    WHEN 2 THEN 'Problem z karta do zamka (brak reakcji)'
    WHEN 3 THEN 'Usterka klimatyzacji (slabe chlodzenie)'
    WHEN 4 THEN 'Niedzialajace gniazdko przy lozku'
    WHEN 5 THEN 'Zacieki na suficie (sprawdzic)'
    WHEN 6 THEN 'Drzwi balkonowe nie domykaja sie'
    WHEN 7 THEN 'Telewizor brak sygnalu'
    WHEN 8 THEN 'Zatkany odplyw w prysznicu'
    WHEN 9 THEN 'Hałas wentylatora w lazience'
    WHEN 10 THEN 'Zle dzialajaca spluczka'
    ELSE 'Przeglad ogolny pokoju po zgloszeniu'
  END AS opis,
  CASE
    WHEN (gs % 10) IN (0,1,2) THEN 'DONE'
    WHEN (gs % 10) IN (3,4,5) THEN 'IN_PROGRESS'
    ELSE 'REPORTED'
  END AS status,
  CASE
    WHEN (gs % 10) IN (0,1,2) THEN 1 + (gs % 5)
    ELSE NULL
  END AS czas_trwania,
  1 + (gs % 50) AS id_pokoju,
  CASE WHEN (gs % 2) = 0 THEN 7 ELSE 8 END AS id_pracownika
FROM generate_series(1, 100) gs
ON CONFLICT (id_konserwacji) DO NOTHING;

INSERT INTO konserwacja (id_konserwacji, data_zgloszenia, opis, status, czas_trwania, id_pokoju, id_pracownika)
SELECT
  10000 + (1 * 100) + gs AS id_konserwacji,
  (CURRENT_DATE - ((gs * 5) % 180))::date AS data_zgloszenia,
  CASE (gs % 12)
    WHEN 0 THEN 'Nieszczelnosc prysznica'
    WHEN 1 THEN 'Rozregulowana klamka w drzwiach'
    WHEN 2 THEN 'Awaria czujnika dymu (fałszywy alarm)'
    WHEN 3 THEN 'Grzejnik nie grzeje'
    WHEN 4 THEN 'Okno nie domyka sie'
    WHEN 5 THEN 'Uszkodzona listwa przypodlogowa'
    WHEN 6 THEN 'Slaby zasieg Wi-Fi w pokoju (sprawdzic router)'
    WHEN 7 THEN 'Zepsuty pilot do TV'
    WHEN 8 THEN 'Zatkany zlew'
    WHEN 9 THEN 'Trzeszczace lozko (dokrecic stelaz)'
    WHEN 10 THEN 'Brak cieplej wody (intermitentnie)'
    ELSE 'Kontrola po zgloszeniu przez recepcje'
  END AS opis,
  CASE
    WHEN (gs % 10) IN (0,1,2) THEN 'DONE'
    WHEN (gs % 10) IN (3,4,5) THEN 'IN_PROGRESS'
    ELSE 'REPORTED'
  END AS status,
  CASE
    WHEN (gs % 10) IN (0,1,2) THEN 1 + (gs % 5)
    ELSE NULL
  END AS czas_trwania,
  50 + (1 + (gs % 50)) AS id_pokoju,   -- 51..100
  CASE WHEN (gs % 2) = 0 THEN 15 ELSE 16 END AS id_pracownika
FROM generate_series(1, 100) gs
ON CONFLICT (id_konserwacji) DO NOTHING;

INSERT INTO konserwacja (id_konserwacji, data_zgloszenia, opis, status, czas_trwania, id_pokoju, id_pracownika)
SELECT
  10000 + (2 * 100) + gs AS id_konserwacji,
  (CURRENT_DATE - ((gs * 7) % 180))::date AS data_zgloszenia,
  CASE (gs % 12)
    WHEN 0 THEN 'Usterka zamka drzwi (zacina sie)'
    WHEN 1 THEN 'Migotanie oswietlenia w lazience'
    WHEN 2 THEN 'Nieszczelnosc przy umywalce'
    WHEN 3 THEN 'Klimatyzacja glosno pracuje'
    WHEN 4 THEN 'Nie dziala gniazdo przy biurku'
    WHEN 5 THEN 'Zacieki na scianie (sprawdzic szczelnosc)'
    WHEN 6 THEN 'Drzwi szafy zsuniete z prowadnicy'
    WHEN 7 THEN 'TV brak dzwieku'
    WHEN 8 THEN 'Zatkany odplyw w wannie'
    WHEN 9 THEN 'Uszkodzony prysznic (sluchawka)'
    WHEN 10 THEN 'Awaria lampki nocnej'
    ELSE 'Drobne naprawy po przegladzie pokoju'
  END AS opis,
  CASE
    WHEN (gs % 10) IN (0,1,2) THEN 'DONE'
    WHEN (gs % 10) IN (3,4,5) THEN 'IN_PROGRESS'
    ELSE 'REPORTED'
  END AS status,
  CASE
    WHEN (gs % 10) IN (0,1,2) THEN 1 + (gs % 5)
    ELSE NULL
  END AS czas_trwania,
  100 + (1 + (gs % 50)) AS id_pokoju,  -- 101..150
  CASE WHEN (gs % 2) = 0 THEN 23 ELSE 24 END AS id_pracownika
FROM generate_series(1, 100) gs
ON CONFLICT (id_konserwacji) DO NOTHING;

INSERT INTO konserwacja (id_konserwacji, data_zgloszenia, opis, status, czas_trwania, id_pokoju, id_pracownika)
SELECT
  10000 + (3 * 100) + gs AS id_konserwacji,
  (CURRENT_DATE - ((gs * 11) % 180))::date AS data_zgloszenia,
  CASE (gs % 12)
    WHEN 0 THEN 'Nieszczelnosc okna (przeciag)'
    WHEN 1 THEN 'Awaria gniazdka w lazience'
    WHEN 2 THEN 'Problem z oswietleniem korytarza (pokoj)'
    WHEN 3 THEN 'Nie dziala ogrzewanie podlogowe (jesli jest)'
    WHEN 4 THEN 'Zepsuta zaslona (karnisz)'
    WHEN 5 THEN 'Skrzypiace drzwi wejsciowe'
    WHEN 6 THEN 'Usterka czajnika elektrycznego'
    WHEN 7 THEN 'Nieszczelnosc spłuczki'
    WHEN 8 THEN 'Zatkany prysznic'
    WHEN 9 THEN 'TV brak sygnalu (sprawdzic kabel)'
    WHEN 10 THEN 'Uszkodzony uchwyt recznika'
    ELSE 'Naprawa drobna po zgloszeniu recepcji'
  END AS opis,
  CASE
    WHEN (gs % 10) IN (0,1,2) THEN 'DONE'
    WHEN (gs % 10) IN (3,4,5) THEN 'IN_PROGRESS'
    ELSE 'REPORTED'
  END AS status,
  CASE
    WHEN (gs % 10) IN (0,1,2) THEN 1 + (gs % 5)
    ELSE NULL
  END AS czas_trwania,
  150 + (1 + (gs % 50)) AS id_pokoju,  -- 151..200
  CASE WHEN (gs % 2) = 0 THEN 31 ELSE 32 END AS id_pracownika
FROM generate_series(1, 100) gs
ON CONFLICT (id_konserwacji) DO NOTHING;

SELECT setval(pg_get_serial_sequence('konserwacja', 'id_konserwacji'),
              (SELECT COALESCE(MAX(id_konserwacji), 1) FROM konserwacja));


