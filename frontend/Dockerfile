# Use Node.js 24 Alpine (Lightweight and compatible with Next.js 16)
FROM node:24-alpine

# Set the working directory inside the container
WORKDIR /app

# 1. Copy package files first
# This optimizes Docker layer caching. If package.json doesn't change, 
# Docker skips the heavy "npm install" step on rebuilds.
COPY package*.json ./

# 2. Install dependencies
RUN npm install

# 3. Copy the rest of the source code
COPY . .

# Expose standard Next.js port
EXPOSE 3000

# Start the app in Development mode (Hot Reloading enabled)
# This uses the "dev" script from your package.json
CMD ["npm", "run", "dev"]