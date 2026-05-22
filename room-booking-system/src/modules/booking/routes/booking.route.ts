import { Router } from 'express';
import { BookingController } from '../controller/booking.controller';
import { authenticate } from '../../../common/middleware/auth.middleware';
import { requireRole } from '../../../common/middleware/role.middleware';
import { validateDto } from '../../../common/middleware/validation.middleware';
import { CreateBookingDto } from '../dto/create-booking.dto';

const router = Router();
const bookingController = new BookingController();

// All booking routes require authentication
router.use(authenticate);

// User routes
router.post('/', validateDto(CreateBookingDto), bookingController.createBooking);
router.get('/my', bookingController.getMyBookings);
router.patch('/:id/cancel', bookingController.cancelBooking);
router.get('/:id/owner-contact', bookingController.getOwnerContact);

// Owner routes
router.get('/incoming', requireRole(['OWNER']), bookingController.getIncomingRequests);
router.patch('/:id/approve', requireRole(['OWNER']), bookingController.approveBooking);
router.patch('/:id/reject', requireRole(['OWNER']), bookingController.rejectBooking);

export default router;