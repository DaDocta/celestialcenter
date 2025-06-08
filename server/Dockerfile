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

# Cloud Run requires the app to listen on $PORT (default to 8080)
ENV PORT=8080

# Expose the required port
EXPOSE 8080

# Run the app
CMD ["npm", "start"]
