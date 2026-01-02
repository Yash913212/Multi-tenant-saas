FROM node:20-alpine

# Install curl and wget for healthchecks
RUN apk add --no-cache curl wget

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY . .

# Expose port
EXPOSE 5000

# Start application (migrations and seeds run automatically in server.js)
CMD ["npm", "start"]
