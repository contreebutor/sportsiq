# ---- Base deps builder ----
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- Builder (TypeScript compile) ----
FROM node:20-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Production runtime ----
FROM node:20-slim AS runner
ENV NODE_ENV=production
WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init && rm -rf /var/lib/apt/lists/*

# Copy node_modules (prod only) and dist
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

# Non-root user
RUN useradd -m nodeuser && chown -R nodeuser:nodeuser /app
USER nodeuser

EXPOSE 8080
ENV PORT=8080

ENTRYPOINT ["/usr/bin/dumb-init", "--", "node"]
CMD ["dist/server.js"]


