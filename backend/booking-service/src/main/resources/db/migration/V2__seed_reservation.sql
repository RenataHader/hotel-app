BEGIN;

INSERT INTO gosc (id_goscia, imie, nazwisko, nr_telefonu, nr_dokumentu)
SELECT
  gs AS id_goscia,
  (ARRAY['Jan','Anna','Piotr','Katarzyna','Tomasz','Agnieszka','Pawel','Monika','Michal','Julia','Adam','Karolina','Mateusz','Ewa','Krzysztof','Alicja','Robert','Natalia','Damian','Barbara'])
    [1 + (gs % 20)] AS imie,
  (ARRAY['Kowalski','Nowak','Wisniewski','Wojcik','Kowalczyk','Kaminski','Lewandowski','Zielinski','Szymanski','Dabrowski','Kozlowski','Jankowski','Mazur','Kwiatkowski','Wozniak','Krawczyk','Piotrowski','Grabowski','Zajac','Pawlak','Michalski','Krol','Wieczorek','Jablonski','Stępniewski','Lis','Czarnecki','Sokolowski','Urban','Krupa'])
    [1 + (gs % 30)] AS nazwisko,
  ('5' || LPAD((10000000 + gs)::text, 8, '0')) AS nr_telefonu,
  ('DOC' || LPAD(gs::text, 8, '0')) AS nr_dokumentu
FROM generate_series(1, 1200) gs
ON CONFLICT (id_goscia) DO NOTHING;

SELECT setval(pg_get_serial_sequence('gosc', 'id_goscia'),
              (SELECT COALESCE(MAX(id_goscia), 1) FROM gosc));

COMMIT;


BEGIN;

DROP TABLE IF EXISTS tmp_seed_rez;

CREATE TEMP TABLE tmp_seed_rez AS
WITH gs AS (
  SELECT generate_series(1, 3000) AS n
),
base AS (
  SELECT
    n AS nr_rezerwacji,
    1 + (n % 1200) AS id_goscia,
    1 + (n % 4) AS id_hotelu,

    CASE
      WHEN (n % 50) = 0 THEN 6
      WHEN (n % 25) = 0 THEN 5
      ELSE 1 + (n % 4)
    END AS liczba_gosci,

    1 + (n % 5) AS id_wyzywienia,

    CASE
      WHEN (n % 100) < 40 THEN 'ZAREZEROWANE'
      WHEN (n % 100) < 50 THEN 'ANULOWANE'
      WHEN (n % 100) < 75 THEN 'ZAKWATEROWANE'
      ELSE 'WYKWATEROWANE'
    END AS status,

    CASE
      WHEN (n % 20) = 0 THEN 3
      WHEN (n % 4) = 0 THEN 2
      ELSE 1
    END AS room_count,

    ((1 + (n % 4)) - 1) * 50 + (1 + ((n * 7) % 50))        AS r1,
    ((1 + (n % 4)) - 1) * 50 + (1 + ((n * 7 + 13) % 50))   AS r2,
    ((1 + (n % 4)) - 1) * 50 + (1 + ((n * 7 + 27) % 50))   AS r3,

    CASE WHEN (n % 3)  = 0 THEN 1 + (n % 20) END           AS s1_raw,
    CASE WHEN (n % 11) = 0 THEN 1 + ((n + 7) % 20) END     AS s2_raw
  FROM gs
),
svc AS (
  SELECT *,
    s1_raw AS s1,
    CASE
      WHEN s2_raw IS NULL THEN NULL
      WHEN s2_raw = s1_raw THEN (s2_raw % 20) + 1
      ELSE s2_raw
    END AS s2
  FROM base
),
dates AS (
  SELECT *,
    CASE
      WHEN status='ZAREZEROWANE' THEN
        CASE
          WHEN (nr_rezerwacji % 120) = 0 THEN CURRENT_DATE
          ELSE (CURRENT_DATE + (1 + (nr_rezerwacji % 365)))
        END

      WHEN status='ANULOWANE' THEN
        CASE
          WHEN (nr_rezerwacji % 2)=0 THEN (CURRENT_DATE + (1 + (nr_rezerwacji % 365)))
          ELSE (CURRENT_DATE - (1 + (nr_rezerwacji % 365)))
        END

      WHEN status='ZAKWATEROWANE' THEN (CURRENT_DATE - (nr_rezerwacji % 3))

      ELSE (CURRENT_DATE - (10 + (nr_rezerwacji % 730)))
    END AS data_zameldowania
  FROM svc
),
dates2 AS (
  SELECT *,
    CASE
      WHEN status='ZAKWATEROWANE' THEN (CURRENT_DATE + (1 + (nr_rezerwacji % 5)))

      ELSE (data_zameldowania + (1 + (nr_rezerwacji % 10)))
    END AS data_wymeldowania
  FROM dates
),
calc AS (
  SELECT *,
    (data_wymeldowania - data_zameldowania) AS nights,
    CASE id_wyzywienia
      WHEN 1 THEN 0.00
      WHEN 2 THEN 40.00
      WHEN 3 THEN 90.00
      WHEN 4 THEN 60.00
      WHEN 5 THEN 160.00
    END AS meal_price
  FROM dates2
),
room_prices AS (
  SELECT *,
    (CASE (((r1 - 1) % 50 + 1) % 5)
      WHEN 0 THEN 220.00
      WHEN 1 THEN 320.00
      WHEN 2 THEN 300.00
      WHEN 3 THEN 520.00
      WHEN 4 THEN 450.00
    END) AS p1,
    (CASE (((r2 - 1) % 50 + 1) % 5)
      WHEN 0 THEN 220.00
      WHEN 1 THEN 320.00
      WHEN 2 THEN 300.00
      WHEN 3 THEN 520.00
      WHEN 4 THEN 450.00
    END) AS p2,
    (CASE (((r3 - 1) % 50 + 1) % 5)
      WHEN 0 THEN 220.00
      WHEN 1 THEN 320.00
      WHEN 2 THEN 300.00
      WHEN 3 THEN 520.00
      WHEN 4 THEN 450.00
    END) AS p3
  FROM calc
),
totals AS (
  SELECT *,
    (p1
      + CASE WHEN room_count >= 2 THEN p2 ELSE 0 END
      + CASE WHEN room_count = 3 THEN p3 ELSE 0 END
    ) * nights AS rooms_total,
    (meal_price * liczba_gosci * nights) AS meal_total,
    (
      CASE WHEN s1 IS NULL THEN 0 ELSE
        CASE
          WHEN s1 IN (1,2,3,4,11,15) THEN
            (CASE s1 WHEN 1 THEN 20 WHEN 2 THEN 25 WHEN 3 THEN 10 WHEN 4 THEN 60 WHEN 11 THEN 120 WHEN 15 THEN 35 END) * liczba_gosci * nights
          WHEN s1 IN (5,8,12,13,16,18) THEN
            (CASE s1 WHEN 5 THEN 30 WHEN 8 THEN 40 WHEN 12 THEN 60 WHEN 13 THEN 25 WHEN 16 THEN 20 WHEN 18 THEN 45 END) * nights
          ELSE
            (CASE s1 WHEN 6 THEN 150 WHEN 7 THEN 80 WHEN 9 THEN 50 WHEN 10 THEN 70 WHEN 14 THEN 200 WHEN 17 THEN 30 WHEN 19 THEN 100 WHEN 20 THEN 100 END)
        END
      END
      +
      CASE WHEN s2 IS NULL THEN 0 ELSE
        CASE
          WHEN s2 IN (1,2,3,4,11,15) THEN
            (CASE s2 WHEN 1 THEN 20 WHEN 2 THEN 25 WHEN 3 THEN 10 WHEN 4 THEN 60 WHEN 11 THEN 120 WHEN 15 THEN 35 END) * liczba_gosci * nights
          WHEN s2 IN (5,8,12,13,16,18) THEN
            (CASE s2 WHEN 5 THEN 30 WHEN 8 THEN 40 WHEN 12 THEN 60 WHEN 13 THEN 25 WHEN 16 THEN 20 WHEN 18 THEN 45 END) * nights
          ELSE
            (CASE s2 WHEN 6 THEN 150 WHEN 7 THEN 80 WHEN 9 THEN 50 WHEN 10 THEN 70 WHEN 14 THEN 200 WHEN 17 THEN 30 WHEN 19 THEN 100 WHEN 20 THEN 100 END)
        END
      END
    ) AS services_total
  FROM room_prices
)
SELECT
  nr_rezerwacji,
  id_goscia,
  id_hotelu,
  liczba_gosci,
  id_wyzywienia,
  data_zameldowania,
  data_wymeldowania,
  ROUND((rooms_total + meal_total + services_total)::numeric, 2) AS kwota,
  status,
  room_count, r1, r2, r3,
  s1, s2
FROM totals;


INSERT INTO rezerwacja
  (nr_rezerwacji, id_goscia, id_hotelu, liczba_gosci, id_wyzywienia,
   data_zameldowania, data_wymeldowania, kwota, status)
SELECT
  nr_rezerwacji, id_goscia, id_hotelu, liczba_gosci, id_wyzywienia,
  data_zameldowania, data_wymeldowania, kwota, status
FROM tmp_seed_rez
ON CONFLICT (nr_rezerwacji) DO NOTHING;

INSERT INTO rezerwacja_pokoje (nr_rezerwacji, id_pokoju, room_order)
SELECT nr_rezerwacji, r1, 0 FROM tmp_seed_rez
UNION ALL
SELECT nr_rezerwacji, r2, 1 FROM tmp_seed_rez WHERE room_count >= 2
UNION ALL
SELECT nr_rezerwacji, r3, 2 FROM tmp_seed_rez WHERE room_count = 3
ON CONFLICT (nr_rezerwacji, id_pokoju) DO NOTHING;

INSERT INTO rezerwacja_uslugi (nr_rezerwacji, id_uslugi, service_order)
SELECT nr_rezerwacji, s1, 0
FROM tmp_seed_rez
WHERE s1 IS NOT NULL
UNION ALL
SELECT nr_rezerwacji, s2, CASE WHEN s1 IS NOT NULL THEN 1 ELSE 0 END
FROM tmp_seed_rez
WHERE s2 IS NOT NULL
ON CONFLICT (nr_rezerwacji, id_uslugi) DO NOTHING;

SELECT setval(pg_get_serial_sequence('rezerwacja', 'nr_rezerwacji'),
              (SELECT COALESCE(MAX(nr_rezerwacji), 1) FROM rezerwacja));

COMMIT;



BEGIN;

INSERT INTO platnosc (nr_rezerwacji, kwota, data_platnosci, metoda_platnosci, status)
SELECT
  r.nr_rezerwacji,
  r.kwota,
  CASE
    WHEN r.status='ZAREZEROWANE' THEN (r.data_zameldowania::timestamp - INTERVAL '7 days')
    WHEN r.status='ANULOWANE' THEN NOW() - ((r.nr_rezerwacji % 30)::text || ' days')::interval
    WHEN r.status='ZAKWATEROWANE' THEN (r.data_zameldowania::timestamp + INTERVAL '2 hours')
    ELSE (r.data_wymeldowania::timestamp + INTERVAL '1 hour')
  END AS data_platnosci,
  CASE (r.nr_rezerwacji % 4)
    WHEN 0 THEN 'CARD'
    WHEN 1 THEN 'BLIK'
    WHEN 2 THEN 'TRANSFER'
    ELSE 'CASH'
  END AS metoda_platnosci,
  CASE
    WHEN r.status='ZAREZEROWANE' AND (r.nr_rezerwacji % 5)=0 THEN 'OCZEKUJACA'
    WHEN r.status='ANULOWANE' AND (r.nr_rezerwacji % 2)=0 THEN 'ZWROCONA'
    WHEN r.status='ANULOWANE' THEN 'ANULOWANA'
    ELSE 'OPLACONA'
  END AS status
FROM rezerwacja r
ON CONFLICT (nr_rezerwacji) DO NOTHING;

SELECT setval(pg_get_serial_sequence('platnosc', 'id_platnosci'),
              (SELECT COALESCE(MAX(id_platnosci), 1) FROM platnosc));

COMMIT;