# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN yarn install

# Install TypeScript globally
RUN yarn add -g typescript ts-node

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start the server
CMD ["yarn", "ts-node", "index.ts"]