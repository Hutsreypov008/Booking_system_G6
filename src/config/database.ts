import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./env";
import { User } from "../modules/users/entity/user.entity";

export const appDataSource = new DataSource({
  type: "mysql",
  host: env.database.host,
  port: env.database.port,
  username: env.database.username,
  password: env.database.password,
  database: env.database.name,
  entities: [User],
  synchronize: false,
  logging: false,
});
