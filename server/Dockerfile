# server/Dockerfile

# Use lightweight Node.js image
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package.json and lock file
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the server code
COPY . .

# Ensure we pick up $PORT (default 8080)
ENV PORT=8080

# Expose the port Cloud Run will use
EXPOSE 8080

# Start the server
CMD ["npm", "start"]
