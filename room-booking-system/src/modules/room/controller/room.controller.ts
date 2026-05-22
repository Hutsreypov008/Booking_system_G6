import { Request, Response } from 'express';
import { RoomService } from '../service/room.service';
import { AuthRequest } from '../../../common/middleware/auth.middleware';
import { successResponse, paginatedResponse } from '../../../common/utils/response';
import { CreateRoomDto } from '../dto/create-room.dto';
import { UpdateRoomDto } from '../dto/update-room.dto';
import { SearchRoomDto } from '../dto/search-room.dto';

export class RoomController {
    private roomService: RoomService;

    constructor() {
        this.roomService = new RoomService();
    }

    searchRooms = async (req: Request, res: Response): Promise<void> => {
        const searchParams: SearchRoomDto = {
            search: req.query.search as string,
            location: req.query.location as string,
            type: req.query.type as any,
            minPrice: req.query.minPrice ? parseInt(req.query.minPrice as string) : undefined,
            maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice as string) : undefined,
            page: req.query.page ? parseInt(req.query.page as string) : 1,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
            sortBy: req.query.sortBy as string,
            sortOrder: req.query.sortOrder as any
        };
        
        const { rooms, total, page, limit } = await this.roomService.searchRooms(searchParams);
        
        res.status(200).json(
            paginatedResponse('Rooms fetched successfully', rooms, total, page, limit)
        );
    };

    getRoomDetails = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const room = await this.roomService.getRoomDetails(id);
        res.status(200).json(successResponse('Room details fetched successfully', room));
    };

    createRoom = async (req: AuthRequest, res: Response): Promise<void> => {
        const ownerId = req.user!.id;
        const createRoomDto = req.body as CreateRoomDto;
        const room = await this.roomService.createRoom(ownerId, createRoomDto);
        res.status(201).json(successResponse('Room created successfully', room));
    };

    getMyRooms = async (req: AuthRequest, res: Response): Promise<void> => {
        const ownerId = req.user!.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        
        const { rooms, total } = await this.roomService.getMyRooms(ownerId, page, limit);
        
        res.status(200).json(
            paginatedResponse('My rooms fetched successfully', rooms, total, page, limit)
        );
    };

    updateRoom = async (req: AuthRequest, res: Response): Promise<void> => {
        const { id } = req.params;
        const ownerId = req.user!.id;
        const updateData = req.body as UpdateRoomDto;
        const room = await this.roomService.updateRoom(id, ownerId, updateData);
        res.status(200).json(successResponse('Room updated successfully', room));
    };

    deleteRoom = async (req: AuthRequest, res: Response): Promise<void> => {
        const { id } = req.params;
        const ownerId = req.user!.id;
        await this.roomService.deleteRoom(id, ownerId);
        res.status(200).json(successResponse('Room deleted successfully'));
    };

    toggleAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
        const { id } = req.params;
        const ownerId = req.user!.id;
        const room = await this.roomService.toggleAvailability(id, ownerId);
        res.status(200).json(successResponse('Room availability toggled successfully', room));
    };

    uploadImage = async (req: AuthRequest, res: Response): Promise<void> => {
        const { id } = req.params;
        const ownerId = req.user!.id;
        const file = req.file;
        
        if (!file) {
            res.status(400).json({ success: false, message: 'No file uploaded' });
            return;
        }
        
        const image = await this.roomService.uploadImage(id, ownerId, file);
        res.status(201).json(successResponse('Image uploaded successfully', image));
    };

    deleteImage = async (req: AuthRequest, res: Response): Promise<void> => {
        const { imageId } = req.params;
        const ownerId = req.user!.id;
        await this.roomService.deleteImage(imageId, ownerId);
        res.status(200).json(successResponse('Image deleted successfully'));
    };
}