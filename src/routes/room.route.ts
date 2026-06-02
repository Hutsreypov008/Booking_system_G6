import { Router } from 'express';
import multer from 'multer';
import { RoomController } from '../controllers/room.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validateDto } from '../middlewares/validation.middleware';
import { CreateRoomDto } from '../models/create-room.dto';
import { UpdateRoomDto } from '../models/update-room.dto';

const router = Router();
const roomController = new RoomController();
const upload = multer({ storage: multer.memoryStorage() });

// Public routes
router.get('/', roomController.searchRooms);
router.get('/:id/availability', roomController.getAvailability);

// Owner only routes
router.post('/', authenticate, requireRole(['OWNER']), validateDto(CreateRoomDto), roomController.createRoom);
router.patch('/', authenticate, requireRole(['OWNER']), upload.single('image'), roomController.uploadImageFromBody);
router.get('/owner/my-rooms', authenticate, requireRole(['OWNER']), roomController.getMyRooms);
router.patch('/:id', authenticate, requireRole(['OWNER']), validateDto(UpdateRoomDto), roomController.updateRoom);
router.put('/:id', authenticate, requireRole(['OWNER']), validateDto(UpdateRoomDto), roomController.updateRoom);
router.delete('/:id', authenticate, requireRole(['OWNER']), roomController.deleteRoom);
router.patch('/:id/availability', authenticate, requireRole(['OWNER']), roomController.toggleAvailability);
router.patch('/:id/images', authenticate, requireRole(['OWNER']), upload.single('image'), roomController.uploadImage);
router.post('/:id/images', authenticate, requireRole(['OWNER']), upload.single('image'), roomController.uploadImage);
router.delete('/images/:imageId', authenticate, requireRole(['OWNER']), roomController.deleteImage);

router.get('/:id', roomController.getRoomDetails);

export default router;
