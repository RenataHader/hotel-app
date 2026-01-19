INSERT INTO hotel (id_hotelu, nazwa, adres) VALUES
  (1, 'Dach w chmurach', 'ul. Widokowa 7, 58-540 Karpacz'),
  (2, 'Dach nad palmą',   'ul. Palmiarnia 3, 60-809 Poznań'),
  (3, 'Dach przy żaglu', 'ul. Marina 12, 81-340 Gdynia'),
  (4, 'Dach w lesie',    'ul. Leśna 22, 17-230 Białowieża')
ON CONFLICT (id_hotelu) DO UPDATE SET nazwa = EXCLUDED.nazwa, adres = EXCLUDED.adres;

INSERT INTO wyzywienie (id_wyzywienia, typ, cena) VALUES
  (1, 'Brak', 0.00),
  (2, 'Śniadanie', 40.00),
  (3, 'Śniadanie i obiad', 90.00),
  (4, 'Obiad', 60.00),
  (5, 'All inclusive', 160.00)
ON CONFLICT (id_wyzywienia) DO UPDATE SET cena = EXCLUDED.cena;

INSERT INTO usluga (id_uslugi, nazwa, typ_rozliczenia, cena) VALUES
  (1, 'Siłownia', 'PER_PERSON_PER_DAY', 20.00),
  (2, 'Basen', 'PER_PERSON_PER_DAY', 25.00),
  (3, 'Sala zabaw dla dzieci', 'PER_PERSON_PER_DAY', 10.00),
  (4, 'SPA / Sauna', 'PER_PERSON_PER_DAY', 60.00),
  (5, 'Parking', 'PER_DAY', 30.00),
  (6, 'Transfer z lotniska', 'PER_STAY', 150.00),
  (7, 'Room service', 'PER_STAY', 80.00),
  (8, 'Wypożyczenie roweru', 'PER_DAY', 40.00),
  (9, 'Pralnia', 'PER_STAY', 50.00),
  (10, 'Mini bar (pakiet)', 'PER_STAY', 70.00),
  (11, 'Opieka nad dzieckiem', 'PER_PERSON_PER_DAY', 120.00),
  (12, 'Kort tenisowy', 'PER_DAY', 60.00),
  (13, 'Bilard', 'PER_DAY', 25.00),
  (14, 'Zwiedzanie z przewodnikiem', 'PER_STAY', 200.00),
  (15, 'Zajęcia fitness', 'PER_PERSON_PER_DAY', 35.00),
  (16, 'Konsola / gry (pokój)', 'PER_DAY', 20.00),
  (17, 'Łóżeczko dziecięce', 'PER_STAY', 30.00),
  (18, 'Zwierzę w pokoju', 'PER_DAY', 45.00),
  (19, 'Późny check-out', 'PER_STAY', 100.00),
  (20, 'Wczesny check-in', 'PER_STAY', 100.00)
ON CONFLICT (id_uslugi) DO UPDATE SET cena = EXCLUDED.cena;

DO $$
DECLARE
    h_id INTEGER;
    room_idx INTEGER;
    room_type TEXT;
    room_num TEXT;
    beds INTEGER;
    price DECIMAL;
    descr TEXT;
    types TEXT[] := ARRAY['Single','Double','Twin','Suite','Family'];
BEGIN
    FOR h_id IN 1..4 LOOP
        FOR room_idx IN 1..50 LOOP
            room_num := LPAD(room_idx::text, 3, '0');
            room_type := types[1 + (room_idx % 5)];
            
            CASE room_type
                WHEN 'Single' THEN beds := 1; price := 220.00; descr := 'Komfortowy pokój jednoosobowy idealny na pobyt służbowy lub krótki wypad. Łóżko pojedyncze, biurko do pracy, szafa, telewizor, Wi-Fi i sejf. Zestaw do kawy i herbaty. Prywatna łazienka z prysznicem, suszarką, kosmetykami i kompletem ręczników.';
                WHEN 'Double' THEN beds := 2; price := 320.00; descr := 'Przestronny pokój dwuosobowy z łóżkiem typu double. Telewizor, Wi-Fi, sejf, szafa i stolik. Mini-lodówka oraz zestaw do kawy i herbaty. Łazienka z prysznicem lub wanną, suszarką, kosmetykami i kompletem ręczników.';
                WHEN 'Twin'   THEN beds := 2; price := 300.00; descr := 'Pokój dwuosobowy z dwoma oddzielnymi łóżkami (twin). Biurko, telewizor, Wi-Fi, sejf i szafa. Mini-lodówka oraz zestaw do kawy i herbaty. Prywatna łazienka z prysznicem lub wanną, suszarką, kosmetykami i kompletem ręczników.';
                WHEN 'Suite'  THEN beds := 3; price := 520.00; descr := 'Apartament typu Suite o podwyższonym standardzie: część sypialniana oraz strefa wypoczynkowa. Telewizor, Wi-Fi, sejf, biurko. Mini-lodówka i zestaw do kawy i herbaty. Elegancka łazienka z prysznicem walk-in lub wanną, szlafrokami, kapciami, kosmetykami i ręcznikami.';
                WHEN 'Family' THEN beds := 4; price := 450.00; descr := 'Pokój rodzinny dla 3–4 osób z większą przestrzenią. Telewizor, Wi-Fi, sejf, szafa i stolik. Mini-lodówka oraz zestaw do kawy i herbaty. Prywatna łazienka z prysznicem lub wanną, suszarką, kosmetykami i kompletem ręczników.';
            END CASE;

            INSERT INTO pokoj (id_hotelu, nr_pokoju, typ, liczba_lozek, cena, opis, status)
            VALUES (h_id, room_num, room_type, beds, price, descr, 'AVAILABLE')
            ON CONFLICT (id_hotelu, nr_pokoju) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;