FROM node:22-bookworm-slim

WORKDIR /app

# FFmpeg is used both for Discord audio filters and for YouTube HLS streams.
# Keep the image lightweight: no local bgutil PO-token server is needed anymore.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    ca-certificates \
  && python3 -m pip install --no-cache-dir --break-system-packages -U "yt-dlp[default]" yt-dlp-ejs \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

CMD ["npm", "start"]
