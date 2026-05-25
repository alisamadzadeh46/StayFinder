FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# Build React into /app/dist
RUN npm run build

# ── Final stage: just the built files ──
FROM alpine:3.19
WORKDIR /static
COPY --from=builder /app/dist .
