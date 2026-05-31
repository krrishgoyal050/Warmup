import express from 'express';
import cors from 'cors';
import { config } from './config';
import apiRouter from './routes';
import { errorHandler } from './middleware/errorMiddleware';

const app = express();

// Configure CORS to support local frontend and Google Cloud Run links
app.use(cors({
  origin: '*', // Allow all for convenience. In production this should be configured strictly
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Main entry welcome route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Travel Planning & Experience Engine API',
    version: '1.0.0',
    mockModeActive: config.gemini.isMock,
  });
});

// Mount operational routes
app.use('/api', apiRouter);

// Bind centralized error handler middleware
app.use(errorHandler);

// Start the server
const server = app.listen(config.port, () => {
  console.log(`[SERVER RUNNING] Access the server on http://localhost:${config.port}`);
});

// Export server instance for integration testing
export { app, server };
