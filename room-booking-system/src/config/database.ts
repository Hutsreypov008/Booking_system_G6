import { DataSource } from 'typeorm';
import { env } from './env';
import { User } from '../modules/users/entity/user.entity';
import { Room } from '../modules/room/entity/room.entity';
import { RoomImage } from '../modules/room/entity/room-image.entity';
import { Booking } from '../modules/booking/entity/booking.entity';
import { RefreshToken } from '../modules/auth/entity/refresh-token.entity';
import { Favorite } from '../modules/users/entity/favorite.entity';

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