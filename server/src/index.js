const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const prisma = require('../config/prisma');

const PORT = process.env.PORT || 1234;

const runServer=async()=>{
    try{
        await prisma.$connect();
        console.log('✅ Connected to PostgreSQL database successfully.');

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });

        const gracefulShutdown = async () => {
        console.log(' shutting down server...');
        server.close(async () => {
            await prisma.$disconnect();
            console.log('🔒 Database connection closed.');
            process.exit(0);
        });
        };

        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);

    } catch (error) {
        console.error('❌ Failed to connect to the database:', error);
        await prisma.$disconnect();
        process.exit(1);
  }
}

runServer()