import { Router } from 'express';
import multer from 'multer';
import { RoomController } from '../controller/room.controller';
import { authenticate } from '../../../common/middleware/auth.middleware';
import { requireRole } from '../../../common/middleware/role.middleware';
import { validateDto } from '../../../common/middleware/validation.middleware';
import { CreateRoomDto } from '../dto/create-room.dto';
import { UpdateRoomDto } from '../dto/update-room.dto';

const router = Router();
const roomController = new RoomController();
const upload = multer({ storage: multer.memoryStorage() });

// Public routes
router.get('/', roomController.searchRooms);
router.get('/:id', roomController.getRoomDetails);

// Owner only routes
router.post('/', authenticate, requireRole(['OWNER']), validateDto(CreateRoomDto), roomController.createRoom);
router.get('/owner/my-rooms', authenticate, requireRole(['OWNER']), roomController.getMyRooms);
router.patch('/:id', authenticate, requireRole(['OWNER']), validateDto(UpdateRoomDto), roomController.updateRoom);
router.delete('/:id', authenticate, requireRole(['OWNER']), roomController.deleteRoom);
router.patch('/:id/availability', authenticate, requireRole(['OWNER']), roomController.toggleAvailability);
router.post('/:id/images', authenticate, requireRole(['OWNER']), upload.single('image'), roomController.uploadImage);
router.delete('/images/:imageId', authenticate, requireRole(['OWNER']), roomController.deleteImage);

export default router;