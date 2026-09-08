FROM node:20-slim

RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm install

COPY apps/backend apps/backend
COPY packages/shared packages/shared

RUN cd apps/backend && npx prisma generate

EXPOSE 3002

CMD ["npx", "tsx", "apps/backend/src/index.ts"]