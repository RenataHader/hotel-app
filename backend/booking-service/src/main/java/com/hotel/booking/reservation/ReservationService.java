package com.hotel.booking.reservation;

import com.hotel.booking.guest.Guest;
import com.hotel.booking.guest.GuestRepository;
import com.hotel.booking.payment.Payment;
import com.hotel.booking.payment.PaymentRepository;
import com.hotel.security.JwtUser;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepo;
    private final GuestRepository guestRepo;
    private final CatalogClient catalogClient;
    private final PaymentRepository paymentRepo;

    public List<ReservationResponse> getAllReservations() {
        return reservationRepo.findAll().stream().map(this::mapToResponse).toList();
    }

    public List<ReservationResponse> getMyReservations() {
        Guest guest = getAuthenticatedGuest();
        return reservationRepo.findAllByGuest_IdOrderByCheckInDateDesc(guest.getId()).stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<ReservationResponse> getHotelReservations() {
        JwtUser user = getJwtUser();
        if (user.hotelId() == null) {
            throw new IllegalArgumentException("Brak hotelId w tokenie");
        }
        return reservationRepo.findAllByHotelIdOrderByCheckInDateDesc(user.hotelId()).stream()
                .map(this::mapToResponse)
                .toList();
    }

    public Page<ReservationResponse> getMyReservationsPage(int page, int size) {
        JwtUser user = getJwtUser();
        if (user.guestId() == null) throw new IllegalArgumentException("Użytkownik nie jest gościem");

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "checkInDate"));
        return reservationRepo.findAllByGuest_Id(user.guestId(), pageable).map(this::mapToResponse);
    }

    public Page<ReservationResponse> getHotelReservationsPage(int page, int size) {
        JwtUser user = getJwtUser();
        if (user.hotelId() == null) throw new IllegalArgumentException("Endpoint dla personelu");

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "checkInDate"));
        return reservationRepo.findAllByHotelId(user.hotelId(), pageable).map(this::mapToResponse);
    }

    public ReservationQuoteResponse quote(ReservationRequest request) {
        validateDates(request.getCheckInDate(), request.getCheckOutDate());

        long nights = ChronoUnit.DAYS.between(request.getCheckInDate(), request.getCheckOutDate());
        if (nights <= 0) throw new IllegalArgumentException("Check-out musi być po check-in");

        Selection selection = selectRoomsForRequest(request);

        List<Integer> requestedRoomIds = normalizeRoomIds(request);
        if (!requestedRoomIds.isEmpty()) {
            if (reservationRepo.existsAnyRoomOverlap(
                    requestedRoomIds,
                    request.getCheckInDate(),
                    request.getCheckOutDate()
            )) {
                throw new IllegalArgumentException("Wybrany pokój jest już zajęty w tym terminie");
            }
        }

        SelectionPricing pricing = priceSelection(selection.rooms(), nights);

        if (request.getGuestCount() == null || request.getGuestCount() <= 0) {
            throw new IllegalArgumentException("guestCount jest wymagane do wyceny (wyżywienie/usługi)");
        }

        Integer mealId = request.getMealId();
        if (mealId == null) {
            throw new IllegalArgumentException("mealId jest wymagane");
        }

        CatalogClient.MealSnapshot meal = catalogClient.getMealById(mealId);
        if (meal == null || meal.price() == null) {
            throw new IllegalArgumentException("Nieprawidłowe mealId: " + mealId);
        }

        String mealType = meal.type();
        BigDecimal mealPricePerPerson = money(meal.price());
        BigDecimal mealTotal = mealPricePerPerson
                .multiply(BigDecimal.valueOf(request.getGuestCount()))
                .multiply(BigDecimal.valueOf(nights));

        List<Integer> serviceIds = request.getServiceIds() == null ? List.of() : request.getServiceIds();
        BigDecimal servicesTotal = BigDecimal.ZERO;
        List<SelectedServiceResponse> servicesOut = new ArrayList<>();

        for (Integer id : serviceIds) {
            if (id == null) continue;

            CatalogClient.ServiceSnapshot s = catalogClient.getService(id);
            if (s == null || s.price() == null || s.billingType() == null) {
                throw new IllegalArgumentException("Nieprawidłowa usługa id=" + id);
            }

            BigDecimal unit = money(s.price());
            ServiceBillingType billing;
            try {
                billing = ServiceBillingType.valueOf(s.billingType());
            } catch (Exception e) {
                throw new IllegalArgumentException("Nieprawidłowy billingType usługi id=" + id + ": " + s.billingType());
            }

            BigDecimal serviceTotal = switch (billing) {
                case PER_STAY -> unit;
                case PER_DAY -> unit.multiply(BigDecimal.valueOf(nights));
                case PER_PERSON_PER_DAY -> unit.multiply(BigDecimal.valueOf(nights))
                        .multiply(BigDecimal.valueOf(request.getGuestCount()));
            };

            serviceTotal = money(serviceTotal);
            servicesTotal = servicesTotal.add(serviceTotal);

            servicesOut.add(SelectedServiceResponse.builder()
                    .id(s.id())
                    .name(s.name())
                    .billingType(s.billingType())
                    .unitPrice(unit)
                    .totalPrice(serviceTotal)
                    .build());
        }

        BigDecimal roomsTotal = money(pricing.total());
        BigDecimal total = money(roomsTotal.add(mealTotal).add(servicesTotal));

        return ReservationQuoteResponse.builder()
                .nights(nights)
                .hotelId(selection.hotelId())
                .hotelName(selection.hotelName())
                .rooms(pricing.rooms())
                .guestCount(request.getGuestCount())
                .totalBeds(pricing.totalBeds())
                .mealType(mealType)
                .mealPricePerPerson(mealPricePerPerson)
                .mealTotal(money(mealTotal))
                .services(servicesOut)
                .servicesTotal(money(servicesTotal))
                .roomsTotal(roomsTotal)
                .total(total)
                .build();
    }

    @Transactional
    public ReservationResponse createReservation(ReservationRequest request) {
        Guest guest = getAuthenticatedGuest();

        ReservationQuoteResponse quote = quote(request);
        BigDecimal serverTotal = money(quote.getTotal());

        if (request.getClientPrice() != null) {
            BigDecimal client = money(request.getClientPrice());
            if (client.compareTo(serverTotal) != 0) {
                throw new PriceConflictException("Cena się zmieniła – odśwież podsumowanie.", client, serverTotal, quote);
            }
        }

        List<Integer> roomIds = quote.getRooms().stream().map(ReservedRoomResponse::getRoomId).toList();
        if (reservationRepo.existsAnyRoomOverlap(roomIds, request.getCheckInDate(), request.getCheckOutDate())) {
            throw new IllegalArgumentException("Co najmniej jeden z wybranych pokoi jest już zajęty w tym terminie");
        }

        int totalBeds = quote.getTotalBeds() == null ? 0 : quote.getTotalBeds();
        if (request.getGuestCount() != null && request.getGuestCount() > 0 && totalBeds < request.getGuestCount()) {
            throw new IllegalArgumentException("Za mało miejsc (łóżek) dla guestCount=" + request.getGuestCount());
        }

        List<ReservedRoomResponse> rooms = quote.getRooms();
        if (rooms == null || rooms.isEmpty()) {
            throw new IllegalArgumentException("Musisz wybrać przynajmniej jeden pokój");
        }

        Reservation reservation = new Reservation();
        reservation.setGuest(guest);

        reservation.setHotelId(quote.getHotelId());
        reservation.setHotelName(quote.getHotelName());

        reservation.setGuestCount(request.getGuestCount());
        reservation.setCheckInDate(request.getCheckInDate());
        reservation.setCheckOutDate(request.getCheckOutDate());

        reservation.setPrice(serverTotal);

        reservation.setMealType(quote.getMealType());
        reservation.setMealPricePerPerson(quote.getMealPricePerPerson());

        List<Integer> reqServiceIds = request.getServiceIds() == null ? List.of() : request.getServiceIds();
        reservation.setServiceIds(new ArrayList<>(reqServiceIds.stream().filter(Objects::nonNull).toList()));

        reservation.setRoomId(rooms.get(0).getRoomId());
        reservation.setRoomNumber(rooms.get(0).getRoomNumber());
        reservation.setRoomIds(new ArrayList<>(rooms.stream().map(ReservedRoomResponse::getRoomId).toList()));

        reservation.setRoomType(computeRoomType(rooms));
        reservation.setStatus(ReservationStatus.CONFIRMED);

        Reservation saved = reservationRepo.save(reservation);

        createInitialPaymentIfMissing(saved);

        return mapToResponse(saved);
    }

    private void createInitialPaymentIfMissing(Reservation saved) {
        if (saved == null || saved.getId() == null) {
            throw new IllegalArgumentException("Nie udało się utworzyć rezerwacji (brak ID).");
        }

        if (paymentRepo.findByReservation_Id(saved.getId()).isPresent()) {
            return;
        }

        try {
            Payment payment = Payment.builder()
                    .reservation(saved)
                    .amount(saved.getPrice())
                    .paymentDate(LocalDateTime.now())
                    .paymentMethod("ONLINE")
                    .status("PENDING")
                    .build();

            paymentRepo.save(payment);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalArgumentException("Nie udało się utworzyć płatności (błąd bazy / constraint).");
        } catch (Exception e) {
            throw new IllegalArgumentException("Nie udało się utworzyć płatności: " + e.getMessage());
        }
    }

    @Transactional
    public void cancelReservation(Integer id) {
        JwtUser user = getJwtUser();

        Reservation reservation;
        if (user.guestId() != null) {
            reservation = reservationRepo.findByIdAndGuest_Id(id, user.guestId())
                    .orElseThrow(() -> new IllegalArgumentException("Rezerwacja nie istnieje"));
        } else if (user.hotelId() != null) {
            reservation = reservationRepo.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Rezerwacja nie istnieje"));
            if (!user.hotelId().equals(reservation.getHotelId())) {
                throw new IllegalArgumentException("Brak uprawnień do tego hotelu");
            }
        } else {
            throw new IllegalArgumentException("Brak uprawnień");
        }

        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            return;
        }

        if (reservation.getStatus() == ReservationStatus.CHECKED_IN ||
                reservation.getStatus() == ReservationStatus.CHECKED_OUT) {
            throw new IllegalArgumentException("Nie można anulować po check-in");
        }

        LocalDate today = LocalDate.now();
        if (!today.isBefore(reservation.getCheckInDate())) {
            throw new IllegalArgumentException("Nie można anulować w dniu zameldowania ani później");
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservationRepo.save(reservation);

        paymentRepo.findByReservation_Id(id).ifPresent(p -> {
            p.setStatus("CANCELLED");
            paymentRepo.save(p);
        });
    }

    @Transactional
    public void updateStatus(Integer id, String value) {
        JwtUser user = getJwtUser();
        if (user.hotelId() == null) throw new IllegalArgumentException("Endpoint dla personelu");

        ReservationStatus newStatus;
        try {
            newStatus = ReservationStatus.valueOf(value);
        } catch (Exception e) {
            throw new IllegalArgumentException("Nieznany status: " + value);
        }

        if (newStatus == ReservationStatus.CANCELLED) {
            throw new IllegalArgumentException("Użyj endpointu /cancel");
        }

        Reservation reservation = reservationRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Rezerwacja nie istnieje"));

        if (!user.hotelId().equals(reservation.getHotelId())) {
            throw new IllegalArgumentException("Brak uprawnień do tego hotelu");
        }
        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw new IllegalArgumentException("Rezerwacja jest anulowana");
        }

        if (newStatus == ReservationStatus.CHECKED_IN && reservation.getStatus() != ReservationStatus.CONFIRMED) {
            throw new IllegalArgumentException("CHECKED_IN tylko z CONFIRMED");
        }
        if (newStatus == ReservationStatus.CHECKED_OUT && reservation.getStatus() != ReservationStatus.CHECKED_IN) {
            throw new IllegalArgumentException("CHECKED_OUT tylko z CHECKED_IN");
        }

        reservation.setStatus(newStatus);
        reservationRepo.save(reservation);
    }

    private Selection selectRoomsForRequest(ReservationRequest request) {
        List<Integer> requested = normalizeRoomIds(request);

        if (!requested.isEmpty()) {
            List<CatalogClient.RoomSnapshot> rooms = requested.stream()
                    .map(catalogClient::getRoom)
                    .toList();

            if (rooms.stream().anyMatch(Objects::isNull)) {
                throw new IllegalArgumentException("Jeden z pokoi nie istnieje w catalog-service");
            }

            Integer hotelId = rooms.get(0).hotelId();
            String hotelName = rooms.get(0).hotelName();

            boolean differentHotel = rooms.stream().anyMatch(r -> !Objects.equals(hotelId, r.hotelId()));
            if (differentHotel) throw new IllegalArgumentException("Wszystkie pokoje muszą być z jednego hotelu");

            if (request.getHotelId() != null && !request.getHotelId().equals(hotelId)) {
                throw new IllegalArgumentException("Wybrane pokoje są z innego hotelu niż hotelId");
            }

            return new Selection(hotelId, hotelName, rooms);
        }

        if (request.getHotelId() == null) {
            throw new IllegalArgumentException("Podaj roomId/roomIds albo hotelId");
        }
        if (request.getGuestCount() == null || request.getGuestCount() <= 0) {
            throw new IllegalArgumentException("Dla auto-doboru podaj guestCount > 0");
        }

        List<CatalogClient.RoomSnapshot> available = catalogClient.getAvailableRooms(
                request.getHotelId(), request.getCheckInDate(), request.getCheckOutDate()
        );
        if (available.isEmpty()) throw new IllegalArgumentException("Brak dostępnych pokoi w tym terminie");

        available.sort(Comparator
                .comparing((CatalogClient.RoomSnapshot r) -> safeInt(r.numberOfBeds())).reversed()
                .thenComparing(r -> safeMoney(r.price()))
        );

        List<CatalogClient.RoomSnapshot> chosen = new ArrayList<>();
        int beds = 0;

        for (CatalogClient.RoomSnapshot room : available) {
            if (beds >= request.getGuestCount()) break;
            chosen.add(room);
            beds += safeInt(room.numberOfBeds());
        }

        if (beds < request.getGuestCount()) {
            throw new IllegalArgumentException("Brak wystarczającej liczby łóżek dla guestCount=" + request.getGuestCount());
        }

        return new Selection(request.getHotelId(), chosen.get(0).hotelName(), chosen);
    }

    private SelectionPricing priceSelection(List<CatalogClient.RoomSnapshot> rooms, long nights) {
        List<ReservedRoomResponse> outRooms = new ArrayList<>();
        int totalBeds = 0;
        BigDecimal total = BigDecimal.ZERO;

        for (CatalogClient.RoomSnapshot r : rooms) {
            if (r.price() == null) throw new IllegalArgumentException("Brak ceny pokoju w catalog-service");

            BigDecimal perNight = money(r.price());
            total = total.add(perNight.multiply(BigDecimal.valueOf(nights)));
            totalBeds += safeInt(r.numberOfBeds());

            outRooms.add(ReservedRoomResponse.builder()
                    .roomId(r.id())
                    .roomNumber(r.roomNumber())
                    .type(r.type())
                    .numberOfBeds(r.numberOfBeds())
                    .pricePerNight(perNight)
                    .build());
        }

        return new SelectionPricing(outRooms, totalBeds, money(total));
    }

    private List<Integer> normalizeRoomIds(ReservationRequest request) {
        LinkedHashSet<Integer> ids = new LinkedHashSet<>();
        if (request.getRoomIds() != null) {
            for (Integer id : request.getRoomIds()) {
                if (id != null) ids.add(id);
            }
        }
        if (request.getRoomId() != null) {
            ids.add(request.getRoomId());
        }
        return new ArrayList<>(ids);
    }

    private String computeRoomType(List<ReservedRoomResponse> rooms) {
        if (rooms == null || rooms.isEmpty()) return "UNKNOWN";
        String first = rooms.get(0).getType();
        if (first == null) return "UNKNOWN";
        boolean same = rooms.stream().allMatch(r -> first.equalsIgnoreCase(r.getType()));
        return same ? first : "MIXED";
    }

    private Guest getAuthenticatedGuest() {
        JwtUser user = getJwtUser();
        if (user.guestId() == null) throw new IllegalArgumentException("Użytkownik nie jest gościem");
        return guestRepo.findById(user.guestId())
                .orElseThrow(() -> new IllegalArgumentException("Gość nie istnieje"));
    }

    private JwtUser getJwtUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof JwtUser user)) {
            throw new IllegalArgumentException("Brak zalogowanego użytkownika");
        }
        return user;
    }

    private void validateDates(LocalDate checkIn, LocalDate checkOut) {
        if (checkIn == null || checkOut == null) throw new IllegalArgumentException("Daty są wymagane");
        if (!checkOut.isAfter(checkIn)) throw new IllegalArgumentException("Check-out musi być po check-in");
    }

    private BigDecimal money(BigDecimal v) {
        if (v == null) return null;
        return v.setScale(2, RoundingMode.HALF_UP);
    }

    private int safeInt(Integer v) {
        return v == null ? 0 : v;
    }

    private BigDecimal safeMoney(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }

    private ReservationResponse mapToResponse(Reservation r) {
        String guestFullName = (r.getGuest() == null)
                ? null
                : (r.getGuest().getFirstName() + " " + r.getGuest().getLastName());

        List<ReservedRoomResponse> rooms;
        int totalBeds = 0;

        try {
            List<Integer> ids = (r.getRoomIds() == null) ? new ArrayList<>() : new ArrayList<>(r.getRoomIds());
            if (ids.isEmpty() && r.getRoomId() != null) ids = List.of(r.getRoomId());

            rooms = ids.stream()
                    .map(catalogClient::getRoom)
                    .filter(Objects::nonNull)
                    .map(s -> ReservedRoomResponse.builder()
                            .roomId(s.id())
                            .roomNumber(s.roomNumber())
                            .type(s.type())
                            .numberOfBeds(s.numberOfBeds())
                            .pricePerNight(s.price() == null ? null : money(s.price()))
                            .build())
                    .toList();

            totalBeds = rooms.stream().mapToInt(rr -> safeInt(rr.getNumberOfBeds())).sum();
        } catch (Exception e) {
            List<Integer> ids = (r.getRoomIds() == null) ? new ArrayList<>() : new ArrayList<>(r.getRoomIds());
            if (ids.isEmpty() && r.getRoomId() != null) ids = List.of(r.getRoomId());

            rooms = ids.stream()
                    .filter(Objects::nonNull)
                    .map(id -> ReservedRoomResponse.builder().roomId(id).build())
                    .toList();
        }

        List<SelectedServiceResponse> services = List.of();
        try {
            long nights = (r.getCheckInDate() != null && r.getCheckOutDate() != null)
                    ? ChronoUnit.DAYS.between(r.getCheckInDate(), r.getCheckOutDate())
                    : 0;

            List<Integer> sids = (r.getServiceIds() == null) ? List.of() : r.getServiceIds();
            List<SelectedServiceResponse> tmp = new ArrayList<>();

            for (Integer sid : sids) {
                if (sid == null) continue;
                CatalogClient.ServiceSnapshot s = catalogClient.getService(sid);
                if (s == null) continue;

                BigDecimal unit = s.price() == null ? null : money(s.price());
                BigDecimal total = null;

                if (unit != null && s.billingType() != null && nights > 0 && r.getGuestCount() != null) {
                    try {
                        ServiceBillingType billing = ServiceBillingType.valueOf(s.billingType());
                        total = switch (billing) {
                            case PER_STAY -> unit;
                            case PER_DAY -> unit.multiply(BigDecimal.valueOf(nights));
                            case PER_PERSON_PER_DAY -> unit.multiply(BigDecimal.valueOf(nights))
                                    .multiply(BigDecimal.valueOf(r.getGuestCount()));
                        };
                        total = money(total);
                    } catch (Exception ignored) {}
                }

                tmp.add(SelectedServiceResponse.builder()
                        .id(s.id())
                        .name(s.name())
                        .billingType(s.billingType())
                        .unitPrice(unit)
                        .totalPrice(total)
                        .build());
            }

            services = tmp;
        } catch (Exception ignored) {}

        return ReservationResponse.builder()
                .id(r.getId())
                .guestFullName(guestFullName)
                .hotelId(r.getHotelId())
                .hotelName(r.getHotelName())
                .roomId(r.getRoomId())
                .roomNumber(r.getRoomNumber())
                .rooms(rooms)
                .guestCount(r.getGuestCount())
                .totalBeds(totalBeds)
                .checkInDate(r.getCheckInDate())
                .checkOutDate(r.getCheckOutDate())
                .mealType(r.getMealType())
                .mealPricePerPerson(r.getMealPricePerPerson())
                .services(services)
                .price(r.getPrice())
                .status(r.getStatus() == null ? null : r.getStatus().name())
                .build();
    }

    private record Selection(Integer hotelId, String hotelName, List<CatalogClient.RoomSnapshot> rooms) {}
    private record SelectionPricing(List<ReservedRoomResponse> rooms, int totalBeds, BigDecimal total) {}
}
