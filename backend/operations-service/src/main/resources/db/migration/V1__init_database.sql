CREATE TABLE pracownik (
    id_pracownika SERIAL PRIMARY KEY,
    imie VARCHAR(50) NOT NULL,
    nazwisko VARCHAR(50) NOT NULL,
    stanowisko VARCHAR(50) NOT NULL,
    data_zatrudnienia DATE NOT NULL,
    nr_telefonu VARCHAR(15),
    id_hotelu INTEGER NOT NULL
);

CREATE TABLE konserwacja (
    id_konserwacji SERIAL PRIMARY KEY,
    data_zgloszenia DATE NOT NULL,
    opis TEXT,
    status VARCHAR(20) NOT NULL,
    czas_trwania INTEGER,
    id_pokoju INTEGER NOT NULL,
    id_pracownika INTEGER NOT NULL REFERENCES pracownik(id_pracownika)
);