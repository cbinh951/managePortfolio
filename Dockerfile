# Combined Dockerfile for Frontend + Backend
# Deploys both services in a single container

# ============================================
# Stage 1: Build Backend
# ============================================
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend/ .
RUN npm run build

# ============================================
# Stage 2: Build Frontend
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .

# Build argument for API URL (internal communication)
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build

# ============================================
# Stage 3: Production Runtime
# ============================================
FROM node:20-alpine AS production

# Install process manager to run multiple services
RUN npm install -g pm2

WORKDIR /app

# Copy backend
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/package*.json ./backend/
COPY --from=backend-builder /app/backend/data ./backend/data

# Copy frontend
COPY --from=frontend-builder /app/frontend/.next/standalone ./frontend
COPY --from=frontend-builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=frontend-builder /app/frontend/public ./frontend/public

# Install backend production dependencies
WORKDIR /app/backend
RUN npm ci --only=production

WORKDIR /app

# Create PM2 ecosystem config
RUN echo '{\
  "apps": [\
    {\
      "name": "backend",\
      "cwd": "/app/backend",\
      "script": "dist/server.js",\
      "env": {\
        "NODE_ENV": "production",\
        "PORT": "3001"\
      }\
    },\
    {\
      "name": "frontend",\
      "cwd": "/app/frontend",\
      "script": "server.js",\
      "env": {\
        "NODE_ENV": "production",\
        "PORT": "3000",\
        "HOSTNAME": "0.0.0.0"\
      }\
    }\
  ]\
}' > ecosystem.config.json

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001

# Create startup script (after user creation)
RUN echo '#!/bin/sh' > start.sh && \
    echo '# Start both services with PM2' >> start.sh && \
    echo 'pm2-runtime ecosystem.config.json' >> start.sh && \
    chmod +x start.sh

# Change ownership of all files
RUN chown -R appuser:nodejs /app

USER appuser

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

CMD ["./start.sh"]
