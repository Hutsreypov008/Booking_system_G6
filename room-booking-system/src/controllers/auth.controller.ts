import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { successResponse } from '../utils/response';
import { RegisterDto } from '../Authentication/register.dto';
import { LoginDto } from '../Authentication/login.dto';
import { RefreshTokenDto } from '../Authentication/refresh-token.dto';

export class AuthController {
    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    register = async (req: Request, res: Response): Promise<void> => {
        const registerDto = req.body as RegisterDto;
        const result = await this.authService.register(registerDto);
        res.status(201).json(successResponse('Registration successful', result));
    };

    login = async (req: Request, res: Response): Promise<void> => {
        const loginDto = req.body as LoginDto;
        const result = await this.authService.login(loginDto);
        res.status(200).json(successResponse('Login successful', result));
    };

    refresh = async (req: Request, res: Response): Promise<void> => {
        const { refreshToken } = req.body as RefreshTokenDto;
        const result = await this.authService.refreshToken(refreshToken);
        res.status(200).json(successResponse('Token refreshed successfully', result));
    };

    logout = async (req: AuthRequest, res: Response): Promise<void> => {
        const refreshToken = req.body.refreshToken;
        await this.authService.logout(refreshToken);
        res.status(200).json(successResponse('Logout successful'));
    };
}