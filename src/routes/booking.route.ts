import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validateDto } from '../middlewares/validation.middleware';
import { CreateBookingDto } from '../models/create-booking.dto';
import { UpdateBookingDto } from '../models/update-booking.dto';

const router = Router();
const bookingController = new BookingController();

// All booking routes require authentication
router.use(authenticate);

// User routes
router.post('/', validateDto(CreateBookingDto), bookingController.createBooking);
router.get('/', bookingController.getBookings);
// Allow any authenticated user to view their own bookings
router.get('/my', bookingController.getMyBookings);
router.patch('/:id/cancel', requireRole(['USER']), bookingController.cancelBooking);
router.get('/:id/owner-contact', requireRole(['USER']), bookingController.getOwnerContact);

// Owner routes
router.get('/incoming', requireRole(['OWNER']), bookingController.getIncomingRequests);
// Owner: view all bookings for rooms they own
router.get('/owner', requireRole(['OWNER']), bookingController.getIncomingRequests);
router.patch('/:id/approve', requireRole(['OWNER']), bookingController.approveBooking);
router.patch('/:id/reject', requireRole(['OWNER']), bookingController.rejectBooking);

// Generic status update endpoint
router.patch('/:id/status', validateDto(UpdateBookingDto), bookingController.updateBooking);

// Generic CRUD routes
router.get('/:id', bookingController.getBooking);
router.patch('/:id', validateDto(UpdateBookingDto), bookingController.updateBooking);
router.delete('/:id', bookingController.deleteBooking);

export default router;
