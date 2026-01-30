# Use Node with Chromium for Puppeteer
FROM node:20-slim

# Install Chrome dependencies, Chromium, and tools for youtube-dl-exec
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    python3 \
    curl \
    ca-certificates \
    ffmpeg \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp globally (required by youtube-dl-exec)
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Set Puppeteer to skip downloading Chromium (we use system Chromium)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Skip youtube-dl-exec binary download (we installed yt-dlp manually)
ENV YOUTUBE_DL_SKIP_DOWNLOAD=true

# Create app directory
WORKDIR /app

# Copy package files first for better caching
COPY source/package*.json ./

# Install dependencies (--ignore-scripts to skip youtube-dl-exec preinstall)
RUN npm install --ignore-scripts && npm rebuild

# Copy the rest of the application
COPY source/ ./

# Create generated directory
RUN mkdir -p public/generated

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Start the server
CMD ["node", "server/index.js"]
