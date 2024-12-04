
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


WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci
COPY . .
CMD [ "npx", "nodemon", "server.js" ]
