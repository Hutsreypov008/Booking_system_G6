import { Router } from 'express';
import { RoomController } from '../controllers/room.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();
const roomController = new RoomController();

// Delete image by id (mounted at /api/images)
router.delete('/:id', authenticate, requireRole(['OWNER']), async (req, res) => {
    // map param name expected by controller
    req.params.imageId = req.params.id;
    return roomController.deleteImage(req as any, res as any);
});

export default router;
