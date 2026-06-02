import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Room } from '../models/room.entity';
import { RoomImage } from '../models/room-image.entity';
import { SearchRoomDto } from '../models/search-room.dto';

export class RoomRepository {
    private repository: Repository<Room>;
    private imageRepository: Repository<RoomImage>;

    constructor() {
        this.repository = AppDataSource.getRepository(Room);
        this.imageRepository = AppDataSource.getRepository(RoomImage);
    }

    async create(roomData: Partial<Room>): Promise<Room> {
        const room = this.repository.create(roomData);
        return await this.repository.save(room);
    }

    async findById(id: string): Promise<Room | null> {
        return await this.repository.findOne({
            where: { id },
            relations: ['owner', 'images', 'bookings']
        });
    }

    async findByOwner(ownerId: string, page: number, limit: number): Promise<[Room[], number]> {
        return await this.repository.findAndCount({
            where: { ownerId },
            relations: ['images'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit
        });
    }

    async search(filters: SearchRoomDto): Promise<[Room[], number]> {
        const { search, location, type, minPrice, maxPrice } = filters;
        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const allowedSortColumns = ['createdAt', 'price', 'title', 'location', 'type'];
        const sortBy = filters.sortBy && allowedSortColumns.includes(filters.sortBy)
            ? filters.sortBy
            : 'createdAt';
        const sortOrder = filters.sortOrder === 'ASC' ? 'ASC' : 'DESC';
        
        const queryBuilder = this.repository
            .createQueryBuilder('room')
            .leftJoinAndSelect('room.owner', 'owner')
            .leftJoinAndSelect('room.images', 'images')
            .where('room.isAvailable = :isAvailable', { isAvailable: true });

        if (search) {
            queryBuilder.andWhere('(room.title LIKE :search OR room.description LIKE :search)', {
                search: `%${search}%`
            });
        }

        if (location) {
            queryBuilder.andWhere('room.location LIKE :location', { location: `%${location}%` });
        }

        if (type) {
            queryBuilder.andWhere('room.type = :type', { type });
        }

        if (minPrice !== undefined) {
            queryBuilder.andWhere('room.price >= :minPrice', { minPrice });
        }

        if (maxPrice !== undefined) {
            queryBuilder.andWhere('room.price <= :maxPrice', { maxPrice });
        }

        queryBuilder
            .orderBy(`room.${sortBy}`, sortOrder)
            .skip((page - 1) * limit)
            .take(limit);

        return await queryBuilder.getManyAndCount();
    }

    async update(id: string, roomData: Partial<Room>): Promise<void> {
        await this.repository.update(id, roomData);
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }

    async updateAvailability(id: string, isAvailable: boolean): Promise<void> {
        await this.repository.update(id, { isAvailable });
    }

    // Image methods
    async addImage(roomId: string, url: string, publicId: string, order: number): Promise<RoomImage> {
        const image = this.imageRepository.create({ roomId, url, publicId, order });
        return await this.imageRepository.save(image);
    }

    async deleteImage(imageId: string): Promise<void> {
        await this.imageRepository.delete(imageId);
    }

    async getImages(roomId: string): Promise<RoomImage[]> {
        return await this.imageRepository.find({
            where: { roomId },
            order: { order: 'ASC' }
        });
    }

    async findImageById(imageId: string): Promise<RoomImage | null> {
        return await this.imageRepository.findOne({ where: { id: imageId } });
    }
}
