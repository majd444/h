FROM node:18-alpine

WORKDIR /app

# Create data directory for SQLite database
RUN mkdir -p /app/data && chmod 777 /app/data

# Copy package files first for better layer caching
COPY package.json package-lock.json* ./

# Copy .npmrc for legacy-peer-deps
COPY .npmrc ./

# Install dependencies with legacy-peer-deps
RUN npm install --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Build the application
RUN npm run build

# Expose the port
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
