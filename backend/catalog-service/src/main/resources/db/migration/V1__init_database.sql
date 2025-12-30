CREATE TABLE hotel (
    id_hotelu SERIAL PRIMARY KEY,
    nazwa VARCHAR(100),
    adres VARCHAR(255)
);

CREATE TABLE pokoj (
    id_pokoju SERIAL PRIMARY KEY,
    id_hotelu INTEGER REFERENCES hotel(id_hotelu),
    nr_pokoju VARCHAR(10),
    typ VARCHAR(50),
    liczba_lozek INTEGER,
    cena DECIMAL(10, 2),
    opis TEXT,
    status VARCHAR(20)
);

CREATE TABLE wyzywienie (
    id_wyzywienia SERIAL PRIMARY KEY,
    typ VARCHAR(50),
    cena DECIMAL(10, 2)
);