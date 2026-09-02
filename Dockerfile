# Stage 1: Build dependencies
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

# Stage 2: Distributable production runtime
FROM node:20-alpine
WORKDIR /app

# Create and switch to non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=builder --chown=appuser:appgroup /app /app

EXPOSE 3000
ENV NODE_ENV=production

CMD ["node", "server.js"]