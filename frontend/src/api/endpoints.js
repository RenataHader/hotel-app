// src/api/endpoints.js
export const API = {
  catalog: {
    hotels: "/catalog/hotels",
  },

  booking: {
    quote: "/booking/api/reservations/quote",
    reservations: "/booking/api/reservations",

    // próbujemy po kolei, bo backend może mieć różne ścieżki
    myReservationsCandidates: [
      "/booking/api/reservations/mine",
      "/booking/api/reservations/me",
      "/booking/api/reservations/my",
      "/booking/api/reservations",
    ],
  },

  identity: {
    login: "/identity/auth/login",
    registerGuest: "/identity/auth/register-guest",
    me: "/identity/accounts/me",
  },

  operations: {
    // na razie puste – dodasz jak zaczniesz używać operations
  },
};
