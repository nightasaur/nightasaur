FROM node:20-alpine

WORKDIR /app

# Copy root workspace config
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/
COPY packages/shared/package.json packages/shared/

# Install dependencies
RUN npm install

# Copy source code
COPY apps/backend apps/backend
COPY packages/shared packages/shared

# Generate Prisma client
RUN cd apps/backend && npx prisma generate

# Build
RUN cd apps/backend && npm run build

EXPOSE 3002

# Start
CMD ["node", "apps/backend/dist/index.js"]