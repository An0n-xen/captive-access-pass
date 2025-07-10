# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Install TypeScript globally
RUN npm install -g typescript ts-node

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start the server
CMD ["ts-node", "index.ts"]