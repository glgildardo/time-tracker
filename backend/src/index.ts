import 'dotenv/config';
import { config } from './config/environment';
import { database } from './config/database';
import { createServer } from './server';

const start = async (): Promise<void> => {
  try {
    // Connect to database
    await database.connect();

    // Create and start server
    const server = await createServer();

    await server.listen({
      port: config.PORT,
      host: '0.0.0.0',
    });

    console.log(`🚀 Server running on http://localhost:${config.PORT}`);
    console.log(`📊 Health check: http://localhost:${config.PORT}/health`);
    console.log(`🌍 Environment: ${config.NODE_ENV}`);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

start();
