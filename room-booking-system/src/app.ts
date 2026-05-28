import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { errorHandler } from './middlewares/error.middleware';

// Import routes
import authRoutes from './routes/auth.route';
import userRoutes from './routes/user.route';
import roomRoutes from './routes/room.route';
import bookingRoutes from './routes/booking.route';
import imageRoutes from './routes/image.route';

const app = express();

/* ========================
   MIDDLEWARE
======================== */
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ========================
   REQUEST LOGGER
======================== */
app.use((req, res, next) => {
    console.log(JSON.stringify({
        level: 'INFO',
        message: `${req.method} ${req.originalUrl}`,
        ip: req.ip,
        datetime: new Date().toISOString()
    }));
    next();
});

/* ========================
   API ROUTES (IMPORTANT)
======================== */
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/rooms', roomRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/images', imageRoutes);

/* ========================
   ROOT
======================== */
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Room Booking System API is running',
        datetime: new Date().toISOString(),
        endpoints: {
            health: '/health',
            auth: '/api/auth',
            users: '/api/users',
            rooms: '/api/rooms',
            bookings: '/api/bookings',
            v1: {
                auth: '/api/v1/auth',
                users: '/api/v1/users',
                rooms: '/api/v1/rooms',
                bookings: '/api/v1/bookings'
            }
        }
    });
});

/* ========================
   HEALTH CHECK
======================== */
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        datetime: new Date().toISOString()
    });
});

/* ========================
   404 HANDLER
======================== */
app.use((req, res) => {
    res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.originalUrl}`,
        datetime: new Date().toISOString(),
        path: req.originalUrl
    });
});

/* ========================
   GLOBAL ERROR HANDLER
======================== */
app.use(errorHandler);

export default app;
