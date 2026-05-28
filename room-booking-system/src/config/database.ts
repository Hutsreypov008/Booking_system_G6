import { DataSource } from 'typeorm';
import { env } from './env';
import { User } from '../models/user.entity';
import { Room } from '../models/room.entity';
import { RoomImage } from '../models/room-image.entity';
import { Booking } from '../models/booking.entity';
import { RefreshToken } from '../models/refresh-token.entity';
import { Favorite } from '../models/favorite.entity';

export const AppDataSource = new DataSource({
    type: 'mysql',
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    synchronize: true,
    logging: true, 
    entities: [User, Room, RoomImage, Booking, RefreshToken, Favorite],
    migrations: ['src/database/migration/**/*.ts'],
    subscribers: []
});