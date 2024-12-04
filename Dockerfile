FROM node:20-slim

# Install Chromium dependencies
RUN apt-get update && apt-get install -y \
  chromium \
  libgconf-2-4 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libgdk-pixbuf2.0-0 \
  libgtk-3-0 \
  libgbm-dev \
  libnss3 \
  libxss1 \
  libasound2 \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# Install PM2 globally
RUN npm install -g pm2

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application files
COPY . .

# Expose the port your application will run on
EXPOSE 3000

# Start the application with PM2
CMD ["pm2-runtime", "server.js"]
