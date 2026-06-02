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

export const env = {
  nodeEnv: readEnv("NODE_ENV", "development") || "development",
  port: parsePort(readEnv("PORT"), 3000),
  database: {
    host: readEnv("DATABASE_HOST", "localhost") || "localhost",
    port: parsePort(readEnv("DATABASE_PORT"), 3306),
    username: readEnv("DATABASE_USER", "root") || "root",
    password: readEnv("DATABASE_PASSWORD", "") ?? "",
    name: readEnv("DATABASE_NAME", "room_booking_db") || "room_booking_db",
  },
  jwt: {
    secret: readEnv("JWT_SECRET", "change_this_secret") || "change_this_secret",
    expiresIn: readEnv("JWT_EXPIRES_IN", "1d") || "1d",
  },
} as const;
