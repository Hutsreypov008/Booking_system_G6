import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateDto } from '../middlewares/validation.middleware';
import { RegisterDto } from '../Authentication/register.dto';
import { LoginDto } from '../Authentication/login.dto';
import { RefreshTokenDto } from '../Authentication/refresh-token.dto';

const router = Router();
const authController = new AuthController();

router.post('/register', validateDto(RegisterDto), authController.register);
router.post('/login', validateDto(LoginDto), authController.login);
router.post('/refresh', validateDto(RefreshTokenDto), authController.refresh);
router.post('/logout', authenticate, authController.logout);

export default router;