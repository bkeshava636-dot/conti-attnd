# Production Multi-Stage Dockerfile for Contineo Attendance Tracker
FROM node:20-alpine AS builder

WORKDIR /app

# Install frontend dependencies and build frontend bundle
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

COPY frontend ./frontend
RUN cd frontend && npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Copy server code and built frontend bundle
COPY backend ./backend
COPY test-fixtures ./test-fixtures
COPY --from=builder /app/frontend/dist ./frontend/dist

EXPOSE 5000

CMD ["node", "backend/src/server.js"]
