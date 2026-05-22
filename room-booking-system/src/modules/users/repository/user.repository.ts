import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/database';
import { User } from '../entity/user.entity';
import { Favorite } from '../entity/favorite.entity';

export class UserRepository {
    private repository: Repository<User>;
    private favoriteRepository: Repository<Favorite>;

    constructor() {
        this.repository = AppDataSource.getRepository(User);
        this.favoriteRepository = AppDataSource.getRepository(Favorite);
    }

    async findById(id: string): Promise<User | null> {
        return await this.repository.findOne({ where: { id } });
    }

    async findByEmail(email: string): Promise<User | null> {
        return await this.repository.findOne({ where: { email } });
    }

    async create(userData: Partial<User>): Promise<User> {
        const user = this.repository.create(userData);
        return await this.repository.save(user);
    }

    async update(id: string, userData: Partial<User>): Promise<void> {
        await this.repository.update(id, userData);
    }

    // Favorite methods
    async addFavorite(userId: string, roomId: string): Promise<Favorite> {
        const favorite = this.favoriteRepository.create({ userId, roomId });
        return await this.favoriteRepository.save(favorite);
    }

    async removeFavorite(userId: string, roomId: string): Promise<void> {
        await this.favoriteRepository.delete({ userId, roomId });
    }

    async getUserFavorites(userId: string, page: number, limit: number): Promise<[Favorite[], number]> {
        return await this.favoriteRepository.findAndCount({
            where: { userId },
            relations: ['room', 'room.owner', 'room.images'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit
        });
    }

    async isFavorite(userId: string, roomId: string): Promise<boolean> {
        const favorite = await this.favoriteRepository.findOne({
            where: { userId, roomId }
        });
        return !!favorite;
    }
}