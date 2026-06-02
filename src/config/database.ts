import "dotenv/config";
import "reflect-metadata";
import mysql from "mysql2/promise";
import { DataSource } from "typeorm";
import { env } from "./env";
import { RoomImage } from "../models/room-image.entity";
import { Room } from "../models/room.entity";

export const db = mysql.createPool({
  host: env.database.host,
  port: env.database.port,
  user: env.database.user,
  password: env.database.password,
  database: env.database.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const AppDataSource = new DataSource({
  type: "mysql",
  host: env.database.host,
  port: env.database.port,
  username: env.database.user,
  password: env.database.password,
  database: env.database.name,
  entities: [Room, RoomImage],
  synchronize: false,
  logging: env.nodeEnv === "development",
});

export const initializeDatabase = async () => {
  try {
    const connection = await db.getConnection();
    await connection.ping();
    connection.release();

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log("MySQL Connected");
  } catch (err) {
    console.error("Database connection failed", err);
    throw err;
  }
};

export const testDBConnection = initializeDatabase;
export const database = db;

export default AppDataSource;
