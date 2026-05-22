import { Request, Response } from 'express';
import { BookingService } from '../service/booking.service';
import { AuthRequest } from '../../../common/middleware/auth.middleware';
import { successResponse, paginatedResponse } from '../../../common/utils/response';
import { CreateBookingDto } from '../dto/create-booking.dto';

export class BookingController {
    private bookingService: BookingService;

    constructor() {
        this.bookingService = new BookingService();
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
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        
        const { bookings, total } = await this.bookingService.getUserBookings(userId, page, limit);
        
        res.status(200).json(
            paginatedResponse('My bookings fetched successfully', bookings, total, page, limit)
        );
    };

    cancelBooking = async (req: AuthRequest, res: Response): Promise<void> => {
        const { id } = req.params;
        const userId = req.user!.id;
        
        const booking = await this.bookingService.cancelBooking(id, userId);
        
        res.status(200).json(
            successResponse('Booking cancelled successfully', booking)
        );
    };

    getOwnerContact = async (req: AuthRequest, res: Response): Promise<void> => {
        const { id } = req.params;
        const userId = req.user!.id;
        
        const contactInfo = await this.bookingService.getOwnerContact(id, userId);
        
        res.status(200).json(
            successResponse('Owner contact information fetched successfully', contactInfo)
        );
    };

    getIncomingRequests = async (req: AuthRequest, res: Response): Promise<void> => {
        const ownerId = req.user!.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        
        const { bookings, total } = await this.bookingService.getOwnerBookings(ownerId, page, limit);
        
        res.status(200).json(
            paginatedResponse('Incoming booking requests fetched successfully', bookings, total, page, limit)
        );
    };

    approveBooking = async (req: AuthRequest, res: Response): Promise<void> => {
        const { id } = req.params;
        const ownerId = req.user!.id;
        
        const booking = await this.bookingService.approveBooking(id, ownerId);
        
        res.status(200).json(
            successResponse('Booking approved successfully', booking)
        );
    };

    rejectBooking = async (req: AuthRequest, res: Response): Promise<void> => {
        const { id } = req.params;
        const ownerId = req.user!.id;
        
        const booking = await this.bookingService.rejectBooking(id, ownerId);
        
        res.status(200).json(
            successResponse('Booking rejected successfully', booking)
        );
    };
}