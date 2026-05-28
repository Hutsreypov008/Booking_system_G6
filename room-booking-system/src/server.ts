import 'reflect-metadata';
import app from './app';
import { AppDataSource } from './config/database';
import { env } from './config/env';

const startServer = async () => {
    try {
        // 1. Connect Database
        await AppDataSource.initialize();
        console.log('Database connected successfully');

        // 2. Start Express Server
        const server = app.listen(env.PORT, () => {
            console.log(`
========================================
🚀 Server is running!
Port: ${env.PORT}
Environment: ${env.NODE_ENV}
Started: ${new Date().toISOString()}
========================================
            `);
        });

        // 3. Graceful shutdown
        process.on('SIGTERM', async () => {
            console.log('SIGTERM signal received: closing HTTP server');

            server.close(async () => {
                console.log('HTTP server closed');
                await AppDataSource.destroy();
                console.log('Database connection closed');
                process.exit(0);
            });
        });

        process.on('SIGINT', async () => {
            console.log('SIGINT signal received: shutting down');

            server.close(async () => {
                console.log('HTTP server closed');
                await AppDataSource.destroy();
                console.log('Database connection closed');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('❌ Unable to start server:', error);
        process.exit(1);
    }
};

startServer();