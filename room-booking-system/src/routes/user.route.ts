import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validateDto } from '../middlewares/validation.middleware';
import { UpdateUserDto } from '../models/update-user.dto';
import { RegisterDto } from '../Authentication/register.dto';

const router = Router();
const userController = new UserController();

router.post('/', validateDto(RegisterDto), userController.createUser);

// All user routes require authentication
router.use(authenticate);

// Get all users (owner permission required)
router.get('/', requireRole(['OWNER']), userController.getAllUsers);
// Provide profile endpoints compatible with `/users/profile`
router.get('/me', userController.getProfile);
router.get('/profile', userController.getProfile);
router.patch('/me', validateDto(UpdateUserDto), userController.updateProfile);
router.put('/profile', validateDto(UpdateUserDto), userController.updateProfile);
router.get('/me/bookings', userController.getBookingHistory);
router.get('/me/favorites', userController.getFavorites);
router.post('/me/favorites/:roomId', userController.addFavorite);
router.delete('/me/favorites/:roomId', userController.removeFavorite);

// Allow users to delete their own account: DELETE /users/:id
router.delete('/:id', userController.deleteUser);

export default router;
