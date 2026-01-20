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


DROP TABLE IF EXISTS tmp_seed_rez;
DROP TABLE IF EXISTS tmp_seed_services;

-- ===========================================
-- WARIANT B: wielopokojowe + brak nakładek
-- ===========================================

CREATE TEMP TABLE tmp_seed_rez AS
WITH
special AS (
  SELECT
    ( (h - 1) * 5 + k )::int AS nr_rezerwacji,
    (1 + (((h - 1) * 5 + k) % 1200))::int AS id_goscia,
    h::int AS id_hotelu,

    CASE
      WHEN k IN (1,2,3) THEN 1 + ((h * 7 + k) % 4)
      ELSE 1 + ((h * 11 + k) % 5)
    END::int AS liczba_gosci,

    (1 + ((h * 3 + k) % 5))::int AS id_wyzywienia,

    CASE WHEN k IN (1,2,3) THEN 'ZAKWATEROWANE' ELSE 'ZAREZEROWANE' END AS status,

    CASE WHEN k IN (1,2,3)
      THEN (CURRENT_DATE - (1 + ((h * 10 + k) % 3)))
      ELSE CURRENT_DATE
    END::date AS data_zameldowania,

    CASE WHEN k IN (1,2,3)
      THEN CURRENT_DATE
      ELSE (CURRENT_DATE + (1 + ((h * 13 + k) % 6)))
    END::date AS data_wymeldowania,

    1::int AS room_count,

    ( (h - 1) * 50 + (45 + k) )::int AS r1,
    NULL::int AS r2,
    NULL::int AS r3,

    CASE WHEN k IN (1,2,3) THEN 4 ELSE 3 END::int AS service_count
  FROM generate_series(1,4) h
  CROSS JOIN generate_series(1,5) k
),

bulk_base AS (
  SELECT (n)::int AS nr_rezerwacji
  FROM generate_series(21, 3000) n
),

bulk_assigned AS (
  SELECT
    b.nr_rezerwacji,
    (1 + (b.nr_rezerwacji % 1200))::int AS id_goscia,
    (1 + ((b.nr_rezerwacji * 7) % 4))::int AS id_hotelu,

    CASE
      WHEN (b.nr_rezerwacji % 10) = 0 THEN 3
      WHEN (b.nr_rezerwacji % 4) = 0 THEN 2
      ELSE 1
    END::int AS room_count,

    (1 + ((b.nr_rezerwacji * 13) % 15))::int AS pack_id,

    CASE
      WHEN (b.nr_rezerwacji % 50) = 0 THEN 6
      WHEN (b.nr_rezerwacji % 25) = 0 THEN 5
      ELSE 1 + (b.nr_rezerwacji % 4)
    END::int AS liczba_gosci,

    (1 + (b.nr_rezerwacji % 5))::int AS id_wyzywienia
  FROM bulk_base b
),

bulk_rooms AS (
  SELECT
    a.*,
    ((a.id_hotelu - 1) * 50 + (1 + (a.pack_id - 1) * 3))::int AS r1,
    ((a.id_hotelu - 1) * 50 + (2 + (a.pack_id - 1) * 3))::int AS r2,
    ((a.id_hotelu - 1) * 50 + (3 + (a.pack_id - 1) * 3))::int AS r3
  FROM bulk_assigned a
),

bulk_seq AS (
  SELECT
    br.*,
    row_number() OVER (PARTITION BY br.id_hotelu, br.pack_id ORDER BY br.nr_rezerwacji) AS seq_in_pack
  FROM bulk_rooms br
),

bulk_dates AS (
  SELECT
    s.*,
    (1 + ((s.nr_rezerwacji + s.pack_id * 11) % 10))::int AS nights,
    (CURRENT_DATE - 180 + (s.pack_id % 5) * 10 - (s.id_hotelu % 3) * 3)::date AS base_start
  FROM bulk_seq s
),

bulk_dates2 AS (
  SELECT
    d.*,
    COALESCE(
      SUM( (d.nights + 1) ) OVER (
        PARTITION BY d.id_hotelu, d.pack_id
        ORDER BY d.seq_in_pack
        ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
      ),
      0
    )::int AS offset_days
  FROM bulk_dates d
),

bulk_final AS (
  SELECT
    nr_rezerwacji,
    id_goscia,
    id_hotelu,
    liczba_gosci,
    id_wyzywienia,

    (base_start + offset_days)::date AS data_zameldowania,
    (base_start + offset_days + nights)::date AS data_wymeldowania,

    CASE
      WHEN (nr_rezerwacji % 10) = 0 THEN 'ANULOWANE'
      WHEN (base_start + offset_days + nights) <= CURRENT_DATE THEN 'WYKWATEROWANE'
      WHEN (base_start + offset_days) <= CURRENT_DATE AND (base_start + offset_days + nights) > CURRENT_DATE THEN 'ZAKWATEROWANE'
      ELSE 'ZAREZEROWANE'
    END AS status,

    room_count,
    r1,
    CASE WHEN room_count >= 2 THEN r2 ELSE NULL END AS r2,
    CASE WHEN room_count = 3 THEN r3 ELSE NULL END AS r3,

    CASE
      WHEN (nr_rezerwacji % 5) = 0 THEN 0
      WHEN (nr_rezerwacji % 7) = 0 THEN 6
      WHEN (nr_rezerwacji % 9) = 0 THEN 5
      ELSE 1 + (nr_rezerwacji % 4)
    END::int AS service_count
  FROM bulk_dates2
),

all_rez AS (
  SELECT
    nr_rezerwacji,
    id_goscia,
    id_hotelu,
    liczba_gosci,
    id_wyzywienia,
    data_zameldowania::date AS data_zameldowania,
    data_wymeldowania::date AS data_wymeldowania,
    status,
    room_count,
    r1, r2, r3,
    service_count
  FROM special

  UNION ALL

  SELECT
    nr_rezerwacji,
    id_goscia,
    id_hotelu,
    liczba_gosci,
    id_wyzywienia,
    data_zameldowania,
    data_wymeldowania,
    status,
    room_count,
    r1, r2, r3,
    service_count
  FROM bulk_final
),

priced AS (
  SELECT
    ar.*,
    (ar.data_wymeldowania - ar.data_zameldowania)::int AS nights,

    (CASE (((ar.r1 - 1) % 50 + 1) % 5)
      WHEN 0 THEN 220.00
      WHEN 1 THEN 320.00
      WHEN 2 THEN 300.00
      WHEN 3 THEN 520.00
      WHEN 4 THEN 450.00
    END) AS p1,

    (CASE WHEN ar.r2 IS NULL THEN 0.00 ELSE
      (CASE (((ar.r2 - 1) % 50 + 1) % 5)
        WHEN 0 THEN 220.00
        WHEN 1 THEN 320.00
        WHEN 2 THEN 300.00
        WHEN 3 THEN 520.00
        WHEN 4 THEN 450.00
      END)
    END) AS p2,

    (CASE WHEN ar.r3 IS NULL THEN 0.00 ELSE
      (CASE (((ar.r3 - 1) % 50 + 1) % 5)
        WHEN 0 THEN 220.00
        WHEN 1 THEN 320.00
        WHEN 2 THEN 300.00
        WHEN 3 THEN 520.00
        WHEN 4 THEN 450.00
      END)
    END) AS p3,

    (CASE ar.id_wyzywienia
      WHEN 1 THEN 0.00
      WHEN 2 THEN 40.00
      WHEN 3 THEN 90.00
      WHEN 4 THEN 60.00
      WHEN 5 THEN 160.00
      ELSE 0.00
    END) AS meal_price
  FROM all_rez ar
),

services_lines AS (
  SELECT
    p.nr_rezerwacji,
    (k - 1)::int AS service_order,
    (1 + ((p.nr_rezerwacji * 7 + (k - 1) * 3) % 20))::int AS id_uslugi
  FROM priced p
  JOIN LATERAL generate_series(1, p.service_count) k ON true
),

services_sum AS (
  SELECT
    p.nr_rezerwacji,
    COALESCE(SUM(
      CASE
        -- per osoba * noc
        WHEN sl.id_uslugi IN (1,2,3,4,11,15) THEN
          (CASE sl.id_uslugi
            WHEN 1 THEN 20
            WHEN 2 THEN 25
            WHEN 3 THEN 10
            WHEN 4 THEN 60
            WHEN 11 THEN 120
            WHEN 15 THEN 35
          END) * p.liczba_gosci * p.nights

        -- per noc
        WHEN sl.id_uslugi IN (5,8,12,13,16,18) THEN
          (CASE sl.id_uslugi
            WHEN 5 THEN 30
            WHEN 8 THEN 40
            WHEN 12 THEN 60
            WHEN 13 THEN 25
            WHEN 16 THEN 20
            WHEN 18 THEN 45
          END) * p.nights

        -- flat
        ELSE
          (CASE sl.id_uslugi
            WHEN 6 THEN 150
            WHEN 7 THEN 80
            WHEN 9 THEN 50
            WHEN 10 THEN 70
            WHEN 14 THEN 200
            WHEN 17 THEN 30
            WHEN 19 THEN 100
            WHEN 20 THEN 100
          END)
      END
    ), 0.00) AS services_total
  FROM priced p
  LEFT JOIN services_lines sl ON sl.nr_rezerwacji = p.nr_rezerwacji
  GROUP BY p.nr_rezerwacji
)


SELECT
  p.nr_rezerwacji,
  p.id_goscia,
  p.id_hotelu,
  p.liczba_gosci,
  p.id_wyzywienia,
  p.data_zameldowania,
  p.data_wymeldowania,

  ROUND((
    (p.p1 + p.p2 + p.p3) * p.nights
    + (p.meal_price * p.liczba_gosci * p.nights)
    + COALESCE(ss.services_total, 0.00)
  )::numeric, 2) AS kwota,

  p.status,
  p.room_count, p.r1, p.r2, p.r3,
  p.service_count
FROM priced p
LEFT JOIN services_sum ss ON ss.nr_rezerwacji = p.nr_rezerwacji
ORDER BY p.nr_rezerwacji;

CREATE TEMP TABLE tmp_seed_services AS
WITH p AS (SELECT * FROM tmp_seed_rez)
SELECT
  nr_rezerwacji,
  (k - 1)::int AS service_order,
  (1 + ((nr_rezerwacji * 7 + (k - 1) * 3) % 20))::int AS id_uslugi
FROM p
JOIN LATERAL generate_series(1, p.service_count) k ON true;

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
SELECT nr_rezerwacji, r2, 1 FROM tmp_seed_rez WHERE r2 IS NOT NULL
UNION ALL
SELECT nr_rezerwacji, r3, 2 FROM tmp_seed_rez WHERE r3 IS NOT NULL
ON CONFLICT (nr_rezerwacji, id_pokoju) DO NOTHING;

INSERT INTO rezerwacja_uslugi (nr_rezerwacji, id_uslugi, service_order)
SELECT nr_rezerwacji, id_uslugi, service_order
FROM tmp_seed_services
ON CONFLICT (nr_rezerwacji, id_uslugi) DO NOTHING;

SELECT setval(pg_get_serial_sequence('rezerwacja', 'nr_rezerwacji'),
              (SELECT COALESCE(MAX(nr_rezerwacji), 1) FROM rezerwacja));


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


