# Stage 1: Build the Vite frontend application
FROM node:18-slim AS build-frontend
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Create the final server containing both frontend and backend
FROM node:18-slim
WORKDIR /app

# Ensure we have the backend package.json
COPY backend/package*.json ./
# npm > v8 supports --omit=dev, removing --only=production to avoid errors
RUN npm install --omit=dev

COPY backend/ ./

# Copy built frontend assets from the previous stage into the 'public' directory
COPY --from=build-frontend /app/frontend/dist /app/public

# Cloud Run defaults to assigning the container PORT 8080.
EXPOSE 8080
ENV PORT=8080

CMD ["node", "server.js"]
