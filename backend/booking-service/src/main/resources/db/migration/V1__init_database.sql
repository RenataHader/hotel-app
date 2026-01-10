-- V1__init_booking.sql
-- Schema dla booking-service (goście, rezerwacje, płatności, powiązania pokoi, wyżywienie i usługi)

CREATE TABLE IF NOT EXISTS gosc (
    id_goscia SERIAL PRIMARY KEY,
    imie VARCHAR(50) NOT NULL,
    nazwisko VARCHAR(50) NOT NULL,
    nr_telefonu VARCHAR(15),
    nr_dokumentu VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS rezerwacja (
    nr_rezerwacji SERIAL PRIMARY KEY,
    id_goscia INTEGER NOT NULL REFERENCES gosc(id_goscia),

    id_hotelu INTEGER NOT NULL,
    hotel_name VARCHAR(100),

    room_type VARCHAR(50) NOT NULL,
    guest_count INTEGER,

    -- "główny" pokój (dla kompatybilności 1-pokojowej)
    id_pokoju INTEGER NOT NULL,
    room_number VARCHAR(10),

    data_zameldowania DATE NOT NULL,
    data_wymeldowania DATE NOT NULL,

    price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL,

    -- wyżywienie (snapshot w rezerwacji)
    meal_type VARCHAR(50) NOT NULL DEFAULT 'Brak',
    meal_price_per_person DECIMAL(10, 2) NOT NULL DEFAULT 0.00,

    CONSTRAINT chk_dates CHECK (data_wymeldowania > data_zameldowania),
    CONSTRAINT chk_guest_count CHECK (guest_count IS NULL OR guest_count > 0)
);

CREATE INDEX IF NOT EXISTS idx_rezerwacja_guest ON rezerwacja(id_goscia);
CREATE INDEX IF NOT EXISTS idx_rezerwacja_hotel ON rezerwacja(id_hotelu);

-- dla rezerwacji 1-pokojowych (pole id_pokoju jako "główny" pokój)
CREATE INDEX IF NOT EXISTS idx_rezerwacja_room_dates
    ON rezerwacja(id_pokoju, data_zameldowania, data_wymeldowania);

-- wspiera filtrowanie po statusie i dacie
CREATE INDEX IF NOT EXISTS idx_rezerwacja_status_dates
    ON rezerwacja(status, data_zameldowania, data_wymeldowania);

-- wiele pokoi w jednej rezerwacji
CREATE TABLE IF NOT EXISTS rezerwacja_pokoje (
    nr_rezerwacji INTEGER NOT NULL REFERENCES rezerwacja(nr_rezerwacji) ON DELETE CASCADE,
    id_pokoju INTEGER NOT NULL,
    room_order INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (nr_rezerwacji, id_pokoju),
    UNIQUE (nr_rezerwacji, room_order)
);

CREATE INDEX IF NOT EXISTS idx_rezerwacja_pokoje_room ON rezerwacja_pokoje(id_pokoju);

-- usługi dodatkowe (opcjonalne) przypięte do rezerwacji
CREATE TABLE IF NOT EXISTS rezerwacja_uslugi (
    nr_rezerwacji INTEGER NOT NULL REFERENCES rezerwacja(nr_rezerwacji) ON DELETE CASCADE,
    id_uslugi INTEGER NOT NULL,
    service_order INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (nr_rezerwacji, id_uslugi),
    UNIQUE (nr_rezerwacji, service_order)
);

CREATE INDEX IF NOT EXISTS idx_rezerwacja_uslugi_service ON rezerwacja_uslugi(id_uslugi);

CREATE TABLE IF NOT EXISTS platnosc (
    id_platnosci SERIAL PRIMARY KEY,
    nr_rezerwacji INTEGER NOT NULL UNIQUE REFERENCES rezerwacja(nr_rezerwacji),

    kwota DECIMAL(10, 2) NOT NULL,
    data_platnosci TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metoda_platnosci VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL
);
