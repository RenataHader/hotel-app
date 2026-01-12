export const API = {
  catalog: {
    hotels: "/catalog/hotels",
  },

  booking: {
    quote: "/booking/api/reservations/quote",
    reservations: "/booking/api/reservations",

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

  },
};
