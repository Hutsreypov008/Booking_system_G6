import { Response } from 'express';
import { BookingService } from '../services/booking.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { successResponse, paginatedResponse } from '../utils/response';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { UpdateBookingDto } from '../dto/update-booking.dto';

export class BookingController {
    private readonly bookingService: BookingService;

    constructor() {
        this.bookingService = new BookingService();
    }

    private getIdParam(req: AuthRequest): string {
        const id = req.params.id;
        return Array.isArray(id) ? id[0] : id;
    }

    private getUserRole(req: AuthRequest): string {
        return req.user!.role!;
    }

    createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
        const userId = req.user!.id;
        const createBookingDto = req.body as CreateBookingDto;
        
        const booking = await this.bookingService.createBooking(userId, createBookingDto);
        
        res.status(201).json(
            successResponse('Booking created successfully', booking)
        );
    };

    getMyBookings = async (req: AuthRequest, res: Response): Promise<void> => {
        const userId = req.user!.id;
        const page = Number.parseInt(req.query.page as string) || 1;
        const limit = Number.parseInt(req.query.limit as string) || 10;
        
        const { bookings, total } = await this.bookingService.getUserBookings(userId, page, limit);
        
        res.status(200).json(
            paginatedResponse('My bookings fetched successfully', bookings, total, page, limit)
        );
    };

    getBookings = async (req: AuthRequest, res: Response): Promise<void> => {
        const userId = req.user!.id;
        const userRole = this.getUserRole(req);
        const page = Number.parseInt(req.query.page as string) || 1;
        const limit = Number.parseInt(req.query.limit as string) || 10;

        const { bookings, total } = await this.bookingService.getBookings(userId, userRole, page, limit);

        res.status(200).json(
            paginatedResponse('Bookings fetched successfully', bookings, total, page, limit)
        );
    };

    getBooking = async (req: AuthRequest, res: Response): Promise<void> => {
        const id = this.getIdParam(req);
        const userId = req.user!.id;
        const userRole = this.getUserRole(req);

        const booking = await this.bookingService.getBookingById(id, userId, userRole);

        res.status(200).json(
            successResponse('Booking fetched successfully', booking)
        );
    };

    updateBooking = async (req: AuthRequest, res: Response): Promise<void> => {
        const id = this.getIdParam(req);
        const userId = req.user!.id;
        const userRole = this.getUserRole(req);
        const updateData = req.body as UpdateBookingDto;

        const booking = await this.bookingService.updateBooking(id, userId, userRole, updateData);

        res.status(200).json(
            successResponse('Booking updated successfully', booking)
        );
    };

    deleteBooking = async (req: AuthRequest, res: Response): Promise<void> => {
        const id = this.getIdParam(req);
        const userId = req.user!.id;
        const userRole = this.getUserRole(req);

        await this.bookingService.deleteBooking(id, userId, userRole);

        res.status(200).json(
            successResponse('Booking deleted successfully')
        );
    };

    cancelBooking = async (req: AuthRequest, res: Response): Promise<void> => {
        const id = this.getIdParam(req);
        const userId = req.user!.id;
        
        const booking = await this.bookingService.cancelBooking(id, userId);
        
        res.status(200).json(
            successResponse('Booking cancelled successfully', booking)
        );
    };

    getOwnerContact = async (req: AuthRequest, res: Response): Promise<void> => {
        const id = this.getIdParam(req);
        const userId = req.user!.id;
        
        const contactInfo = await this.bookingService.getOwnerContact(id, userId);
        
        res.status(200).json(
            successResponse('Owner contact information fetched successfully', contactInfo)
        );
    };

    getIncomingRequests = async (req: AuthRequest, res: Response): Promise<void> => {
        const ownerId = req.user!.id;
        const page = Number.parseInt(req.query.page as string) || 1;
        const limit = Number.parseInt(req.query.limit as string) || 10;
        
        const { bookings, total } = await this.bookingService.getOwnerBookings(ownerId, page, limit);
        
        res.status(200).json(
            paginatedResponse('Incoming booking requests fetched successfully', bookings, total, page, limit)
        );
    };

    approveBooking = async (req: AuthRequest, res: Response): Promise<void> => {
        const id = this.getIdParam(req);
        const ownerId = req.user!.id;
        const userRole = this.getUserRole(req);
        
        const booking = await this.bookingService.approveBooking(id, ownerId, userRole);
        
        res.status(200).json(
            successResponse('Booking approved successfully', booking)
        );
    };

    rejectBooking = async (req: AuthRequest, res: Response): Promise<void> => {
        const id = this.getIdParam(req);
        const ownerId = req.user!.id;
        const userRole = this.getUserRole(req);
        
        const booking = await this.bookingService.rejectBooking(id, ownerId, userRole);
        
        res.status(200).json(
            successResponse('Booking rejected successfully', booking)
        );
    };
}
