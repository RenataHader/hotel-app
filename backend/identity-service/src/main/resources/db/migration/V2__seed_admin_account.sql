INSERT INTO konto (email, haslo, rola, id_pracownika, id_goscia)
VALUES (
  'admin@hotel.local',
  '$2b$10$aB.k.aUiqMgv4afH9kQd0.60ohdU7FaofDFuJTKSZnc4/DhqGBOre', -- Hasło: admin123 (przykładowe)
  'ADMIN',
  1,
  NULL
)
ON CONFLICT (email) DO NOTHING;