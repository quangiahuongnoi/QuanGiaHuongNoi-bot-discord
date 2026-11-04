FROM node:22-bookworm-slim

WORKDIR /app

# Cài đặt FFmpeg và thư viện giải mã âm thanh cho Discord Voice (@discordjs/voice)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

CMD ["npm", "start"]
