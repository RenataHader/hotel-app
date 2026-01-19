-- Hasla: bcrypt (pgcrypto)

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS konto (
    id_konta   SERIAL PRIMARY KEY,
    haslo      VARCHAR(255) NOT NULL,
    rola       VARCHAR(30)  NOT NULL,
    email      VARCHAR(255) NOT NULL UNIQUE,

    id_pracownika INTEGER,
    id_goscia     INTEGER,

    CONSTRAINT chk_konto_owner
        CHECK (
            (id_pracownika IS NOT NULL AND id_goscia IS NULL)
            OR
            (id_pracownika IS NULL AND id_goscia IS NOT NULL)
        )
);


-- ADMIN (znane haslo: admin123!)
INSERT INTO konto (email, haslo, rola, id_pracownika, id_goscia)
VALUES (
  'admin@hotel.local',
  crypt('admin123!'::text, gen_salt('bf', 10)),
  'ADMIN',
  1,
  NULL
)
ON CONFLICT (email) DO UPDATE
SET haslo = EXCLUDED.haslo,
    rola = EXCLUDED.rola,
    id_pracownika = EXCLUDED.id_pracownika,
    id_goscia = NULL;


-- haslo: imienazwisko (bez kropek)
WITH emp_src AS (
  SELECT * FROM (VALUES
    (2, 'Jan', 'Kowalski'),
    (3, 'Anna', 'Nowak'),
    (4, 'Piotr', 'Zielinski'),
    (5, 'Ewa', 'Kaczmarek'),
    (6, 'Pawel', 'Maj'),
    (7, 'Krzysztof', 'Lewandowski'),
    (8, 'Alicja', 'Kaminska'),
    (9, 'Monika', 'Szymanska'),
    (10, 'Tomasz', 'Wojcik'),
    (11, 'Karolina', 'Kowalczyk'),
    (12, 'Michal', 'Jablonski'),
    (13, 'Agnieszka', 'Piotrowska'),
    (14, 'Adam', 'Grabowski'),
    (15, 'Patryk', 'Nowicki'),
    (16, 'Natalia', 'Lis'),
    (17, 'Barbara', 'Pawlak'),
    (18, 'Mateusz', 'Witkowski'),
    (19, 'Julia', 'Walczak'),
    (20, 'Damian', 'Baran'),
    (21, 'Katarzyna', 'Zawadzka'),
    (22, 'Robert', 'Czarnecki'),
    (23, 'Marcin', 'Sokolowski'),
    (24, 'Paulina', 'Urban'),
    (25, 'Iwona', 'Krupa'),
    (26, 'Lukasz', 'Kubiak'),
    (27, 'Magdalena', 'Slawinska'),
    (28, 'Jakub', 'Krol'),
    (29, 'Alicja', 'Wieczorek'),
    (30, 'Szymon', 'Zakrzewski'),
    (31, 'Sebastian', 'Stepien'),
    (32, 'Weronika', 'Bialek'),
    (33, 'Elzbieta', 'Jankowska')
  ) AS t(id_pracownika, imie, nazwisko)
),
emp_norm AS (
  SELECT
    id_pracownika,
    lower(translate(imie,    'ąćęłńóśżźĄĆĘŁŃÓŚŻŹ', 'acelnoszzACELNOSZZ')) AS imie_n,
    lower(translate(nazwisko,'ąćęłńóśżźĄĆĘŁŃÓŚŻŹ', 'acelnoszzACELNOSZZ')) AS nazwisko_n
  FROM emp_src
),
emp_final AS (
  SELECT
    id_pracownika,
    (imie_n || '.' || nazwisko_n || '@hotel.local') AS email,
    (imie_n || nazwisko_n) AS base_pass
  FROM emp_norm
),
emp_pass AS (
  SELECT
    id_pracownika,
    email,
    CASE
      WHEN length(base_pass) >= 8 THEN base_pass
      ELSE base_pass || lpad((id_pracownika % 100)::text, 8 - length(base_pass), '0')
    END AS plain_password
  FROM emp_final
)
INSERT INTO konto (email, haslo, rola, id_pracownika, id_goscia)
SELECT
  email,
  crypt(plain_password::text, gen_salt('bf', 10)),
  'EMPLOYEE',
  id_pracownika,
  NULL::int
FROM emp_pass
ON CONFLICT (email) DO UPDATE
SET haslo = EXCLUDED.haslo,
    rola = EXCLUDED.rola,
    id_pracownika = EXCLUDED.id_pracownika,
    id_goscia = NULL;


-- haslo: imienazwisko
WITH gs AS (
  SELECT generate_series(1, 1200) AS id_goscia
),
names AS (
  SELECT
    id_goscia,
    (ARRAY['Jan','Anna','Piotr','Katarzyna','Tomasz','Agnieszka','Pawel','Monika','Michal','Julia','Adam','Karolina','Mateusz','Ewa','Krzysztof','Alicja','Robert','Natalia','Damian','Barbara'])
      [1 + (id_goscia % 20)] AS imie,
    (ARRAY['Kowalski','Nowak','Wisniewski','Wojcik','Kowalczyk','Kaminski','Lewandowski','Zielinski','Szymanski','Dabrowski','Kozlowski','Jankowski','Mazur','Kwiatkowski','Wozniak','Krawczyk','Piotrowski','Grabowski','Zajac','Pawlak','Michalski','Krol','Wieczorek','Jablonski','Stepniewski','Lis','Czarnecki','Sokolowski','Urban','Krupa'])
      [1 + (id_goscia % 30)] AS nazwisko
  FROM gs
),
norm AS (
  SELECT
    id_goscia,
    lower(translate(imie,    'ąćęłńóśżźĄĆĘŁŃÓŚŻŹ', 'acelnoszzACELNOSZZ')) AS imie_n,
    lower(translate(nazwisko,'ąćęłńóśżźĄĆĘŁŃÓŚŻŹ', 'acelnoszzACELNOSZZ')) AS nazwisko_n,
    CASE (id_goscia % 7)
      WHEN 0 THEN 'gmail.com'
      WHEN 1 THEN 'wp.pl'
      WHEN 2 THEN 'onet.pl'
      WHEN 3 THEN 'interia.pl'
      WHEN 4 THEN 'o2.pl'
      WHEN 5 THEN 'outlook.com'
      ELSE 'yahoo.com'
    END AS domain
  FROM names
),
emails AS (
  SELECT
    id_goscia,
    imie_n,
    nazwisko_n,
    domain,
    (imie_n || '.' || nazwisko_n) AS base_local,
    row_number() OVER (PARTITION BY (imie_n || '.' || nazwisko_n), domain ORDER BY id_goscia) AS rn
  FROM norm
),
final AS (
  SELECT
    id_goscia,
    (base_local || CASE WHEN rn=1 THEN '' ELSE rn::text END || '@' || domain) AS email,
    (imie_n || nazwisko_n) AS base_pass
  FROM emails
),
pass AS (
  SELECT
    id_goscia,
    email,
    CASE
      WHEN length(base_pass) >= 8 THEN base_pass
      ELSE base_pass || lpad((id_goscia % 10000)::text, 8 - length(base_pass), '0')
    END AS plain_password
  FROM final
)
INSERT INTO konto (email, haslo, rola, id_pracownika, id_goscia)
SELECT
  email,
  crypt(plain_password::text, gen_salt('bf', 10)),
  'GUEST',
  NULL::int,
  id_goscia
FROM pass
ON CONFLICT (email) DO UPDATE
SET haslo = EXCLUDED.haslo,
    rola = EXCLUDED.rola,
    id_pracownika = NULL,
    id_goscia = EXCLUDED.id_goscia;

SELECT setval(pg_get_serial_sequence('konto', 'id_konta'),
              (SELECT COALESCE(MAX(id_konta), 1) FROM konto));

COMMIT;
