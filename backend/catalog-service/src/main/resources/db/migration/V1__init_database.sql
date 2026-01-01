CREATE TABLE hotel (
    id_hotelu SERIAL PRIMARY KEY,
    nazwa VARCHAR(100) NOT NULL,
    adres VARCHAR(255) NOT NULL
);

CREATE TABLE pokoj (
    id_pokoju SERIAL PRIMARY KEY,
    id_hotelu INTEGER NOT NULL REFERENCES hotel(id_hotelu),
    nr_pokoju VARCHAR(10) NOT NULL,
    typ VARCHAR(50) NOT NULL,
    liczba_lozek INTEGER NOT NULL,
    cena DECIMAL(10, 2) NOT NULL,
    opis TEXT,
    status VARCHAR(20) NOT NULL
);

CREATE TABLE wyzywienie (
    id_wyzywienia SERIAL PRIMARY KEY,
    typ VARCHAR(50) NOT NULL,
    cena DECIMAL(10, 2) NOT NULL
);