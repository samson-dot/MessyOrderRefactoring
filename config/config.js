// every secret, in one place — logic lives elsewhere

export const config = {
  PORT: 4000,
  API_KEY: "super-secret-123",
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
  JWT_SECRET: "change-this-to-a-long-random-string",
};
