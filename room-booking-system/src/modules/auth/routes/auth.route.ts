import { Router } from 'express';
import { AuthController } from '../controller/auth.controller';
import { authenticate } from '../../../common/middleware/auth.middleware';
import { validateDto } from '../../../common/middleware/validation.middleware';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';

const router = Router();
const authController = new AuthController();

router.post('/register', validateDto(RegisterDto), authController.register);
router.post('/login', validateDto(LoginDto), authController.login);
router.post('/refresh', validateDto(RefreshTokenDto), authController.refresh);
router.post('/logout', authenticate, authController.logout);

export default router;