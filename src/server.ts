import { createApp } from './app';
import { ENV } from './config/env';
import { prisma } from './config/prisma';

const app = createApp();

async function startServer() {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('🐘 Connected to PostgreSQL via Prisma ORM');

    const server = app.listen(ENV.PORT, () => {
      console.log(`🚀 Attiks Backend running on port ${ENV.PORT} (${ENV.NODE_ENV})`);
      console.log(`📡 API Healthcheck: http://localhost:${ENV.PORT}/api/health`);
    });

    // Graceful Shutdown Handler (Phase 6: Reliability & High Availability)
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Initiating graceful shutdown...`);
      server.close(async () => {
        console.log('🔌 HTTP server closed. Draining active connections.');
        try {
          await prisma.$disconnect();
          console.log('🐘 PostgreSQL database disconnected safely.');
          process.exit(0);
        } catch (err) {
          console.error('❌ Error during database disconnection:', err);
          process.exit(1);
        }
      });

      // Force close if graceful shutdown takes longer than 10 seconds
      setTimeout(() => {
        console.error('⚠️ Forcefully terminating after 10s timeout.');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      console.error('💥 Unhandled Rejection:', reason);
    });

    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
