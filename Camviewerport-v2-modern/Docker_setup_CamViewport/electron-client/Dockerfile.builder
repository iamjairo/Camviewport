FROM node:18-bullseye

WORKDIR /app

# Install dependencies for Electron building
RUN apt-get update && apt-get install -y \
    wine \
    wine32 \
    wine64 \
    dpkg \
    fakeroot \
    rpm \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# The actual build command will be run via docker-compose
CMD ["npm", "run", "build:all"]