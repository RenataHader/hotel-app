package com.hotel.identity.auth;

import jakarta.validation.constraints.*;

public record RegisterGuestRequest(
        @NotBlank(message = "Email jest wymagany")
        @Email(message = "Niepoprawny format adresu email") // Sprawdza @ i domenę
        String email,

        @NotBlank(message = "Hasło jest wymagane")
        @Size(min = 8, message = "Hasło musi mieć minimum 8 znaków") // Min. 8 znaków
        String password,

        @NotBlank(message = "Imię jest wymagane")
        @Pattern(regexp = "^[a-zA-ZĄĆĘŁŃÓŚŹŻąćęłńóśźż]+$", message = "Imię może zawierać tylko litery") // Tylko litery
        String firstName,

        @NotBlank(message = "Nazwisko jest wymagane")
        @Pattern(regexp = "^[a-zA-ZĄĆĘŁŃÓŚŹŻąćęłńóśźż]+$", message = "Nazwisko może zawierać tylko litery") // Tylko litery
        String lastName,

        @NotBlank(message = "Numer telefonu jest wymagany")
        @Pattern(regexp = "^[0-9]{9}$", message = "Numer telefonu musi składać się z dokładnie 9 cyfr") // Dokładnie 9 cyfr
        String phoneNumber,

        @NotBlank(message = "Numer dokumentu jest wymagany")
        @Pattern(regexp = "^[A-Z]{3}[0-9]{6}$", message = "Numer dokumentu musi mieć format 3 dużych liter i 6 cyfr (np. ABC123456)") // 3 litery + 6 cyfr
        String documentNumber
) {}