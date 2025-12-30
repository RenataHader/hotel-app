CREATE TABLE gosc (
    id_goscia SERIAL PRIMARY KEY,
    imie VARCHAR(50),
    nazwisko VARCHAR(50),
    nr_telefonu VARCHAR(15),
    nr_dokumentu VARCHAR(20)
);

CREATE TABLE rezerwacja (
    nr_rezerwacji SERIAL PRIMARY KEY,
    id_goscia INTEGER REFERENCES gosc(id_goscia),
    id_hotelu INTEGER,
    id_pokoju INTEGER,
    data_zameldowania DATE,
    data_wymeldowania DATE,
    status VARCHAR(20)
);

CREATE TABLE platnosc (
    id_platnosci SERIAL PRIMARY KEY,
    nr_rezerwacji INTEGER REFERENCES rezerwacja(nr_rezerwacji),
    kwota DECIMAL(10, 2),
    data_platnosci TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metoda_platnosci VARCHAR(30),
    status VARCHAR(20)
);