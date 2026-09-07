FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.base.json ./
COPY apps/backend/package*.json apps/backend/
COPY packages/shared/package*.json packages/shared/
RUN npm install
COPY apps/backend apps/backend
COPY packages/shared packages/shared
RUN cd apps/backend && npx prisma generate && npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/apps/backend/dist apps/backend/dist
COPY --from=builder /app/apps/backend/prisma apps/backend/prisma
COPY --from=builder /app/package.json package.json
COPY --from=builder /app/apps/backend/package.json apps/backend/
EXPOSE 3002
CMD ["node", "apps/backend/dist/index.js"]