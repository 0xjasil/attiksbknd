import { createApp } from './app';
import { ENV } from './config/env';
import { prisma } from './config/prisma';

const app = createApp();

async function startServer() {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('🐘 Connected to PostgreSQL via Prisma ORM');

    app.listen(ENV.PORT, () => {
      console.log(`🚀 Attiks Backend running on port ${ENV.PORT} (${ENV.NODE_ENV})`);
      console.log(`📡 API Healthcheck: http://localhost:${ENV.PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
