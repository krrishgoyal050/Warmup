# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /usr/src/app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Node.js Backend
FROM node:20-alpine AS backend-builder
WORKDIR /usr/src/app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npm run build
RUN npm prune --production

# Stage 3: Production Run Container
FROM node:20-alpine
WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=8080

# Copy Backend production assets
COPY --from=backend-builder /usr/src/app/backend/package*.json ./
COPY --from=backend-builder /usr/src/app/backend/node_modules ./node_modules
COPY --from=backend-builder /usr/src/app/backend/dist ./dist

# Copy Frontend compiled assets into a 'public' directory in the backend environment
COPY --from=frontend-builder /usr/src/app/frontend/dist ./public

# Setup secure non-root deployment user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /usr/src/app
USER appuser

EXPOSE 8080

CMD ["node", "dist/index.js"]
