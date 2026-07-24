// every secret, in one place — logic lives elsewhere

export const config = {
  PORT: process.env.PORT || 4000,
  API_KEY: process.env.API_KEY,
  TAX_RATE: 0.075,
  DB_FILE: "messy-orders.db",
  DISCOUNTS: { SAVE10: 0.10, VIP: 0.20, LAUNCH: 0.25 },
  NEXT_STATUS: {
    pending: ["confirmed", "cancelled"],
    confirmed: ["shipped", "cancelled"],
    shipped: ["delivered"],
    delivered: [],
    cancelled: [],
  },
  // added for authn
  JWT_SECRET: process.env.JWT_SECRET,
};
