FROM node:22-bookworm-slim

WORKDIR /app

# Cài đặt FFmpeg và thư viện giải mã âm thanh cho Discord Voice (@discordjs/voice)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
