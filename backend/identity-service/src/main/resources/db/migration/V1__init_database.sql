CREATE TABLE konto (
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
