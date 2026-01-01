CREATE TABLE gosc (
    id_goscia SERIAL PRIMARY KEY,
    imie VARCHAR(50) NOT NULL,
    nazwisko VARCHAR(50) NOT NULL,
    nr_telefonu VARCHAR(15),
    nr_dokumentu VARCHAR(20) NOT NULL
);

CREATE TABLE rezerwacja (
    nr_rezerwacji SERIAL PRIMARY KEY,
    id_goscia INTEGER NOT NULL REFERENCES gosc(id_goscia),
    id_hotelu INTEGER NOT NULL,
    id_pokoju INTEGER NOT NULL,
    data_zameldowania DATE NOT NULL,
    data_wymeldowania DATE NOT NULL,
    status VARCHAR(20) NOT NULL
);

CREATE TABLE platnosc (
    id_platnosci SERIAL PRIMARY KEY,
    nr_rezerwacji INTEGER NOT NULL REFERENCES rezerwacja(nr_rezerwacji),
    kwota DECIMAL(10, 2) NOT NULL,
    data_platnosci TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    metoda_platnosci VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL
);