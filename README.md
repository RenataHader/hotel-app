# Hotel Booking System (hotel-app)

System rezerwacji pokoi dla sieci hoteli — aplikacja webowa w architekturze mikroserwisowej.
Umożliwia rezerwacje online dla gości oraz obsługę pobytu przez pracowników (recepcja/administracja).

## ✨ Funkcje

### Gość (Guest)
- wyszukiwanie dostępnych pokoi w hotelu (zakres dat + hotel)
- wycena rezerwacji (quote) przed zatwierdzeniem
- tworzenie rezerwacji (również wielopokojowych)
- anulowanie rezerwacji
- podgląd historii i statusów rezerwacji

### Pracownik (Employee / recepcja)
- lista rezerwacji hotelu pracownika
- operacje check-in / check-out

### Administrator (Admin)
- zarządzanie pracownikami (CRUD)
- podgląd rezerwacji (widoki administracyjne)
- zarządzanie pokojami/ofertą (np. dodawanie pokoju, dezaktywacja)

## 🧱 Architektura

Backend to zestaw usług Spring Boot + wspólny punkt wejścia (API Gateway):

- **api-gateway** (Spring Cloud Gateway) — routing do usług
- **identity-service** — logowanie, rejestracja, konta i role (JWT)
- **catalog-service** — hotele, pokoje, typy pokoi, usługi/catering
- **booking-service** — rezerwacje, wyceny, statusy, lista gości
- **operations-service** — operacje hotelowe (check-in/out), pracownicy, maintenance
- **security-common** — wspólna konfiguracja JWT/Spring Security

Każda usługa ma osobną bazę **PostgreSQL** i migracje **Flyway**.

**Backend**
- Java 21
- Spring Boot + Spring Security (JWT) + Spring Data JPA
- Spring Cloud Gateway
- PostgreSQL + Flyway
- Maven (multi-module)

**Frontend**
- React + Vite
- React Router
- Axios

**DevOps**
- Docker + Docker Compose
