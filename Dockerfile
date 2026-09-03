# syntax=docker/dockerfile:1

# --- build stage -----------------------------------------------------------
FROM oven/bun:1 AS build
WORKDIR /app

# Install deps first so the layer caches when only source changes.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# --- runtime stage -----------------------------------------------------------
# sharp needs glibc; oven/bun:1-slim is Debian-based, so keep using it.
# Do NOT switch to an Alpine bun image.
FROM oven/bun:1-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

# Production-only install: no vite/tsc/dev tooling in the final image.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/shared ./shared

EXPOSE 3000
CMD ["bun", "run", "server/index.ts"]
