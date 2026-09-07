FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm install
COPY apps/backend apps/backend
COPY packages/shared packages/shared
RUN cd apps/backend && npx prisma generate

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/apps/backend apps/backend
COPY --from=builder /app/packages/shared packages/shared
COPY --from=builder /app/package.json package.json
COPY --from=builder /app/tsconfig.base.json tsconfig.base.json
EXPOSE 3002
CMD ["npx", "tsx", "apps/backend/src/index.ts"]