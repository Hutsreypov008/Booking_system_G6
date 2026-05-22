import { Router } from 'express';
import { UserController } from '../controller/user.controller';
import { authenticate } from '../../../common/middleware/auth.middleware';
import { validateDto } from '../../../common/middleware/validation.middleware';
import { UpdateUserDto } from '../dto/update-user.dto';

const router = Router();
const userController = new UserController();

// All user routes require authentication
router.use(authenticate);

router.get('/me', userController.getProfile);
router.patch('/me', validateDto(UpdateUserDto), userController.updateProfile);
router.get('/me/bookings', userController.getBookingHistory);
router.get('/me/favorites', userController.getFavorites);
router.post('/me/favorites/:roomId', userController.addFavorite);
router.delete('/me/favorites/:roomId', userController.removeFavorite);

export default router;