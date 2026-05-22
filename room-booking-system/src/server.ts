import 'reflect-metadata';
import app from './app';
import { AppDataSource } from './config/database';
import { env } from './config/env';

const startServer = async () => {
    try {
        await AppDataSource.initialize();
        console.log('Database connected successfully');

        const server = app.listen(env.PORT, () => {
            console.log(`
            ========================================
            🚀 Server is running!
            📡 Port: ${env.PORT}
            🌍 Environment: ${env.NODE_ENV}
            📅 Started: ${new Date().toISOString()}
            ========================================
            `);
        });

        process.on('SIGTERM', () => {
            console.log('SIGTERM signal received: closing HTTP server');
            server.close(() => {
                console.log('HTTP server closed');
                AppDataSource.destroy();
            });
        });

    } catch (error) {
        console.error('Unable to start server:', error);
        process.exit(1);
    }
};

startServer();