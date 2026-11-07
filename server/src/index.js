
const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const prisma = require('../config/prisma');
const { startRagWorker } = require('./workers/ragWorker');

const PORT = process.env.PORT || 1234;

let ragWorker;
let server;

const runServer = async () => {
    try {
        await prisma.$connect();

        console.log('Connected to PostgreSQL successfully.');

        // Start the RAG background worker.
        ragWorker = startRagWorker();

        if (!ragWorker) {
            throw new Error('Failed to initialize RAG worker.');
        }

        console.log('RAG worker initialization completed.');

        // Start the HTTP server.
        server = app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });

        // Handle graceful shutdown.
        const gracefulShutdown = async () => {
            console.log('Shutting down server...');

            try {
                if (server) {
                    await new Promise((resolve, reject) => {
                        server.close(error => {
                            if (error) reject(error);
                            else resolve();
                        });
                    });
                }

                if (ragWorker) {
                    await ragWorker.close();
                    console.log('RAG worker closed.');
                }

                await prisma.$disconnect();

                console.log('Database connection closed.');

                process.exit(0);

            } catch (error) {
                console.error('Shutdown error:', error);
                process.exit(1);
            }
        };

        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);

    } catch (error) {
        console.error('Server startup failed:', error);

        await ragWorker?.close().catch(() => {});
        await prisma.$disconnect();

        process.exit(1);
    }
};

runServer();
