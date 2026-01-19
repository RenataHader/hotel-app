CREATE TABLE IF NOT EXISTS hotel (
    id_hotelu SERIAL PRIMARY KEY,
    nazwa VARCHAR(100) NOT NULL,
    adres VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS pokoj (
    id_pokoju SERIAL PRIMARY KEY,
    id_hotelu INTEGER NOT NULL REFERENCES hotel(id_hotelu),
    nr_pokoju VARCHAR(10) NOT NULL,
    typ VARCHAR(50) NOT NULL,
    liczba_lozek INTEGER NOT NULL,
    cena DECIMAL(10, 2) NOT NULL,
    opis TEXT,
    status VARCHAR(20) NOT NULL,

    CONSTRAINT uq_pokoj_hotel_nr UNIQUE (id_hotelu, nr_pokoju)
);

CREATE INDEX IF NOT EXISTS idx_pokoj_hotel ON pokoj(id_hotelu);
CREATE INDEX IF NOT EXISTS idx_pokoj_typ ON pokoj(typ);
CREATE INDEX IF NOT EXISTS idx_pokoj_status ON pokoj(status);

CREATE TABLE IF NOT EXISTS wyzywienie (
    id_wyzywienia SERIAL PRIMARY KEY,
    typ VARCHAR(50) NOT NULL,
    cena DECIMAL(10, 2) NOT NULL,

    CONSTRAINT uq_wyzywienie_typ UNIQUE (typ)
);

CREATE TABLE IF NOT EXISTS usluga (
    id_uslugi SERIAL PRIMARY KEY,
    nazwa VARCHAR(100) NOT NULL,
    typ_rozliczenia VARCHAR(30) NOT NULL,
    cena DECIMAL(10, 2) NOT NULL,

    CONSTRAINT uq_usluga_nazwa UNIQUE (nazwa)
);