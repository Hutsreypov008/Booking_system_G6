import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { errorHandler } from './common/middleware/error.middleware';

// Import routes
import authRoutes from './modules/auth/routes/auth.route';
import userRoutes from './modules/users/routes/user.route';
import roomRoutes from './modules/room/routes/room.route';
import bookingRoutes from './modules/booking/routes/booking.route';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
    console.log(JSON.stringify({
        level: 'INFO',
        message: `${req.method} ${req.path}`,
        ip: req.ip,
        timestamp: new Date().toISOString()
    }));
    next();
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/rooms', roomRoutes);
app.use('/api/v1/bookings', bookingRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`,
        timestamp: new Date().toISOString(),
        path: req.path
    });
});

// Global error handler
app.use(errorHandler);

export default app;