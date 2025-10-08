# Use Node.js LTS (Long Term Support) version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Install TypeScript and build dependencies
RUN npm install --save-dev typescript ts-node @types/node && \
    npm run build || echo "No build script found, using ts-node"

# Expose the port the app runs on
EXPOSE 5001

# Start the application
CMD ["npm", "start"]
