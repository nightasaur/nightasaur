FROM node:20-alpine

WORKDIR /app

# Copy workspace config files
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/shared/package.json packages/shared/package.json

# Install dependencies
RUN npm install

# Copy source code
COPY apps/backend apps/backend
COPY packages/shared packages/shared

# Generate Prisma client
RUN cd apps/backend && npx prisma generate

EXPOSE 3002

CMD ["npx", "tsx", "apps/backend/src/index.ts"]