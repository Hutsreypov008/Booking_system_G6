import dotenv from "dotenv";

dotenv.config();

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);

  return Number.isNaN(parsed) ? fallback : parsed;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: toNumber(process.env.PORT, 3000),
  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  jsonBodyLimit: process.env.JSON_BODY_LIMIT || "1mb",
  JWT_SECRET: process.env.JWT_SECRET || "change_this_secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",
  database: {
    host: process.env.DATABASE_HOST || "localhost",
    port: toNumber(process.env.DATABASE_PORT, 3306),
    user: process.env.DATABASE_USER || "root",
    password: process.env.DATABASE_PASSWORD || "",
    name: process.env.DATABASE_NAME || "booking_system",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "change_this_secret",
    resetSecret: process.env.JWT_RESET_SECRET || process.env.JWT_SECRET || "change_this_secret",
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    resetExpiresIn: process.env.JWT_RESET_EXPIRES_IN || "15m",
  },
};
