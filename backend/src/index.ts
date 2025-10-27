import 'dotenv/config';
import { config } from './config/environment';
import { database } from './config/database';
import { createServer } from './server';

const tryListen = async (
  server: Awaited<ReturnType<typeof createServer>>,
  startPort: number,
  maxAttempts: number = 10
): Promise<number> => {
  let port = startPort;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await server.listen({ port, host: '0.0.0.0' });
      return port;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err && err.code === 'EADDRINUSE') {
        console.warn(`Port ${port} in use, trying ${port + 1}...`);
        port += 1;
        continue;
      }
      throw error;
    }
  }
  throw new Error(`No free port found starting at ${startPort} after ${maxAttempts} attempts`);
};

const start = async (): Promise<void> => {
  try {
    // Connect to database
    await database.connect();

    // Create and start server
    const server = await createServer();

    const actualPort = await tryListen(server, config.PORT);

    console.log(`🚀 Server running on http://localhost:${actualPort}`);
    console.log(`📊 Health check: http://localhost:${actualPort}/health`);
    console.log(`📘 Swagger UI: http://localhost:${actualPort}/docs`);
    console.log(`🧾 OpenAPI JSON: http://localhost:${actualPort}/docs/json`);
    console.log(`🌍 Environment: ${config.NODE_ENV}`);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

start();
