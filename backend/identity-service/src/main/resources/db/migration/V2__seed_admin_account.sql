INSERT INTO konto (email, haslo, rola, id_pracownika, id_goscia)
VALUES ('admin@hotel.local',
        '$2b$10$kxi2kb6jnkaIQXlMGiRLq.SZJcZC9lm8pFZAdqQvCjMtiiblgMo6m',
        'ADMIN',
        1,
        NULL)
ON CONFLICT (email) DO NOTHING;
