import { randomBytes } from 'node:crypto';
import { UserRepository } from '../repositories/user.repository';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { generateToken } from '../utils/jwt';
import { AppError } from '../middlewares/error.middleware';
import { UserRole } from '../models/role.enum';
import { AppDataSource } from '../config/database';

export class AuthService {
    private readonly userRepository: UserRepository;
    private readonly refreshTokenRepository: RefreshTokenRepository;

    constructor() {
        this.userRepository = UserRepository.fromDataSource(AppDataSource);
        this.refreshTokenRepository = new RefreshTokenRepository();
    }

    private generateRefreshToken(): string {
        return randomBytes(64).toString('hex');
    }

    private async generateTokens(user: any) {
        const payload = { id: user.id, email: user.email, role: user.role };
        const accessToken = generateToken(payload);
        const refreshToken = this.generateRefreshToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await this.refreshTokenRepository.create(user.id, refreshToken, expiresAt);
        return { accessToken, refreshToken };
    }

    async register(registerDto: any) {
        const existingUser = await this.userRepository.findByEmail(registerDto.email);
        if (existingUser) {
            throw new AppError('Email already registered', 409);
        }
        const hashedPassword = await hashPassword(registerDto.password);
        const user = this.userRepository.create({
            name: registerDto.name,
            email: registerDto.email,
            passwordHash: hashedPassword,
            phone: registerDto.phone,
            role: registerDto.role || UserRole.USER
        });
        await this.userRepository.save(user);

        const { accessToken, refreshToken } = await this.generateTokens(user);

        console.log(JSON.stringify({
            level: 'INFO',
            message: 'New user registered',
            userId: user.id,
            email: user.email,
            role: user.role,
            datetime: new Date().toISOString()
        }));

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        };
    }

    async login(loginDto: any) {
        const user = await this.userRepository.findByEmail(loginDto.email);
        if (!user) {
            throw new AppError('Invalid email or password', 401);
        }
        const isPasswordValid = await comparePassword(loginDto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new AppError('Invalid email or password', 401);
        }
        const { accessToken, refreshToken } = await this.generateTokens(user);

        console.log(JSON.stringify({
            level: 'INFO',
            message: 'User logged in',
            userId: user.id,
            email: user.email,
            datetime: new Date().toISOString()
        }));

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        };
    }

    async refreshToken(refreshToken: string) {
        const storedToken = await this.refreshTokenRepository.findByToken(refreshToken);
        if (!storedToken) {
            throw new AppError('Invalid refresh token', 401);
        }
        if (storedToken.expiresAt < new Date()) {
            await this.refreshTokenRepository.deleteByToken(refreshToken);
            throw new AppError('Refresh token expired', 401);
        }
        const user = storedToken.user;
        const newAccessToken = generateToken({ id: user.id, email: user.email, role: user.role });
        const newRefreshToken = this.generateRefreshToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await this.refreshTokenRepository.deleteByToken(refreshToken);
        await this.refreshTokenRepository.create(user.id, newRefreshToken, expiresAt);
        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    }

    async logout(refreshToken: string) {
        await this.refreshTokenRepository.deleteByToken(refreshToken);
        console.log(JSON.stringify({
            level: 'INFO',
            message: 'User logged out',
            datetime: new Date().toISOString()
        }));
    }
}
