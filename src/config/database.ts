import "dotenv/config";
import "reflect-metadata";
import { DataSource } from "typeorm";
import { Room } from "../modules/room/entity/room.entity";
import { RoomImage } from "../modules/room/entity/room-image.entity";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DATABASE_HOST ?? "localhost",
  port: Number(process.env.DATABASE_PORT ?? 3306),
  username: process.env.DATABASE_USER ?? "root",
  password: process.env.DATABASE_PASSWORD ?? "",
  database: process.env.DATABASE_NAME ?? "booking_system",
  entities: [Room, RoomImage],
  synchronize: false,
  logging: process.env.NODE_ENV === "development",
});

export const initializeDatabase = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log("Database connected successfully");
  } catch (err) {
    console.error("Database connection failed", err);
    throw err;
  }
};

export const testDBConnection = initializeDatabase;
export const database = AppDataSource;

export default AppDataSource;
