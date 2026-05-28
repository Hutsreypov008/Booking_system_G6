import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { successResponse, paginatedResponse } from '../utils/response';
import { UpdateUserDto } from '../models/update-user.dto';
import { RegisterDto } from '../Authentication/register.dto';

export class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    createUser = async (req: Request, res: Response): Promise<void> => {
        const createUserDto = req.body as RegisterDto;
        const user = await this.userService.createUser(createUserDto);
        res.status(201).json(successResponse('User created successfully', user));
    };

    getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
        const userId = req.user!.id;
        const user = await this.userService.getProfile(userId);
        res.status(200).json(successResponse('Profile fetched successfully', user));
    };

    updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
        const userId = req.user!.id;
        const updateData = req.body as UpdateUserDto;
        const user = await this.userService.updateProfile(userId, updateData);
        res.status(200).json(successResponse('Profile updated successfully', user));
    };

    getBookingHistory = async (req: AuthRequest, res: Response): Promise<void> => {
        const userId = req.user!.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        
        const { bookings, total } = await this.userService.getBookingHistory(userId, page, limit);
        
        res.status(200).json(
            paginatedResponse('Booking history fetched successfully', bookings, total, page, limit)
        );
    };

    getFavorites = async (req: AuthRequest, res: Response): Promise<void> => {
        const userId = req.user!.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        
        const { favorites, total } = await this.userService.getFavorites(userId, page, limit);
        
        res.status(200).json(
            paginatedResponse('Favorites fetched successfully', favorites, total, page, limit)
        );
    };

    addFavorite = async (req: AuthRequest, res: Response): Promise<void> => {
        const userId = req.user!.id;
        const { roomId } = req.params;
        
        const favorite = await this.userService.addFavorite(userId, roomId);
        res.status(201).json(successResponse('Room added to favorites', favorite));
    };

    removeFavorite = async (req: AuthRequest, res: Response): Promise<void> => {
        const userId = req.user!.id;
        const { roomId } = req.params;
        
        await this.userService.removeFavorite(userId, roomId);
        res.status(200).json(successResponse('Room removed from favorites'));
    };

    deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
        const { id } = req.params;
        const requesterId = req.user!.id;
        const requesterRole = req.user!.role;

        await this.userService.deleteUser(id, requesterId, requesterRole);

        res.status(200).json(successResponse('User deleted successfully'));
    };

    getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        
        const { users, total } = await this.userService.getAllUsers(page, limit);
        
        res.status(200).json(
            paginatedResponse('All users fetched successfully', users, total, page, limit)
        );
    };
}
