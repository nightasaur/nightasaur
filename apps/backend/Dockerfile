FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl && \
    ln -sf /usr/lib/libssl.so.3 /lib/libssl.so.3 && \
    ln -sf /usr/lib/libcrypto.so.3 /lib/libcrypto.so.3

COPY package*.json ./
COPY tsconfig.base.json ./
COPY apps/backend/package*.json ./apps/backend/

RUN npm ci --workspace=@nightasaur/backend

COPY apps/backend/ ./apps/backend/

WORKDIR /app/apps/backend

RUN npx prisma generate

EXPOSE 3002

CMD ["npx", "tsx", "src/index.ts"]
