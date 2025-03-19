# Stage 1: Build stage
FROM node:20-alpine AS builder

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install ALL dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Build TypeScript
RUN npm run build



# Stage 2: Production stage
FROM node:20-alpine AS deploy

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --omit=dev

# Copy built application from the builder stage
COPY --from=builder /usr/src/app/dist/src ./dist

# Copy scripts folder for app key generation if needed
COPY scripts ./scripts

# Create a non-root user and switch to it
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs appuser

# Set proper permissions
RUN chown -R appuser:nodejs /usr/src/app
USER appuser

# Define environment variable defaults (these should be overridden at runtime)
ENV NODE_ENV=development \
    LOG_LEVEL=info \
    SESSION_DRIVER=memory

# Start the bot
CMD ["node", "dist/index.js"] 