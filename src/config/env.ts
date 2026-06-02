import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const envFilePath = path.resolve(process.cwd(), ".env");
const fileEnv = fs.existsSync(envFilePath)
  ? dotenv.parse(fs.readFileSync(envFilePath))
  : {};

const readEnv = (key: string, fallback?: string): string | undefined => {
  if (Object.prototype.hasOwnProperty.call(fileEnv, key)) {
    return fileEnv[key];
  }

  return process.env[key] ?? fallback;
};

const parsePort = (value: string | undefined, fallback: number): number => {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
};

const parseList = (value: string | undefined): string[] => {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const assertSecureSecret = (key: string, value: string, nodeEnv: string): string => {
  const insecureValues = new Set(["change_this_secret", "booking-system-access-secret", "booking-system-reset-secret"]);

  if (nodeEnv === "production" && (value.length < 32 || insecureValues.has(value))) {
    throw new Error(`${key} must be at least 32 characters and not use a default value in production`);
  }

  return value;
};

const nodeEnv = readEnv("NODE_ENV", "development") || "development";
const jwtSecret = readEnv("JWT_SECRET", "change_this_secret") || "change_this_secret";
const jwtResetSecret = readEnv("JWT_RESET_SECRET", jwtSecret) || jwtSecret;

export const env = {
  nodeEnv,
  port: parsePort(readEnv("PORT"), 3000),
  corsOrigins: parseList(readEnv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173")),
  jsonBodyLimit: readEnv("JSON_BODY_LIMIT", "100kb") || "100kb",
  database: {
    host: readEnv("DATABASE_HOST", "localhost") || "localhost",
    port: parsePort(readEnv("DATABASE_PORT"), 3306),
    username: readEnv("DATABASE_USER", "root") || "root",
    password: readEnv("DATABASE_PASSWORD", "") ?? "",
    name: readEnv("DATABASE_NAME", "room_booking_db") || "room_booking_db",
  },
  jwt: {
    secret: assertSecureSecret("JWT_SECRET", jwtSecret, nodeEnv),
    resetSecret: assertSecureSecret("JWT_RESET_SECRET", jwtResetSecret, nodeEnv),
    expiresIn: readEnv("JWT_EXPIRES_IN", "1d") || "1d",
    resetExpiresIn: readEnv("JWT_RESET_EXPIRES_IN", "15m") || "15m",
  },
} as const;
