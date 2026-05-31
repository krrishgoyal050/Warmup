import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { errorHandler } from './middleware/errorMiddleware';
import { securityHeaders } from './middleware/security';

const app = express();

// Apply OWASP secure HTTP headers globally
app.use(securityHeaders);

// Configure CORS to support local frontend and Google Cloud Run links
app.use(cors({
  origin: '*', // Allow all for convenience. In production this should be configured strictly
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Mount operational routes
app.use('/api', apiRouter);

// Serve compiled static frontend assets in production environment
const frontendDistPath = path.join(__dirname, '../public');
if (fs.existsSync(frontendDistPath)) {
  console.log(`[PRODUCTION SERVER] Serving static frontend files from: ${frontendDistPath}`);
  app.use(express.static(frontendDistPath));
  // Support React Router single page application client routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  // Fallback welcome message in local api developer mode
  app.get('/', (req, res) => {
    res.json({
      status: 'online',
      service: 'Travel Planning & Experience Engine API',
      version: '1.0.0',
      mockModeActive: config.gemini.isMock,
    });
  });
}

// Bind centralized error handler middleware
app.use(errorHandler);

// Start the server
const server = app.listen(config.port, () => {
  console.log(`[SERVER RUNNING] Access the server on http://localhost:${config.port}`);
});

// Export server instance for integration testing
export { app, server };
