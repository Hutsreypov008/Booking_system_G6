import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { errorHandler } from './middlewares/error.middleware';

// Import routes
import roomRoutes from './routes/room.route';

const app = express();

/* ========================
   MIDDLEWARE
======================== */
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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
app.use('/api/rooms', roomRoutes);
app.use('/api/v1/rooms', roomRoutes);

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
            rooms: '/api/rooms',
            v1: {
                rooms: '/api/v1/rooms'
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
