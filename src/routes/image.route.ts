import { Router } from 'express';
import { RoomController } from '../controllers/room.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';


const router = Router();
const roomController = new RoomController();

// Delete image by id (mounted at /api/images)
router.delete('/:id', authenticateJWT, requireRole(["OWNER"] as any), async (req, res) => {
    // controller method may not exist in this integration; fail gracefully
    if (typeof (roomController as any).deleteImage !== 'function') {
        return res.status(501).json({ success: false, message: "deleteImage not implemented" });
    }
    req.params.imageId = req.params.id;
    return (roomController as any).deleteImage(req as any, res as any);
});


export default router;
