# Use lightweight Node image
FROM node:22-alpine

WORKDIR /app

# Prefer IPv4 DNS resolution to avoid socket timeouts/hangs inside Docker
ENV NODE_OPTIONS="--dns-result-order=ipv4first"
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Install pnpm via npm with mirror fallback (avoids flaky corepack fetch)
RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm@10.23.0 || npm install -g pnpm@10.23.0 --registry=https://registry.npmmirror.com/

# Create non-root user early
RUN addgroup -S app && adduser -S app -G app

# Copy only dependency files first (for optimal Docker layer caching)
COPY --chown=app:app package.json pnpm-lock.yaml .npmrc* ./

# Configure pnpm network resilience and install dependencies with cache mount (with mirror fallback)
RUN --mount=type=cache,id=pnpm-backend-store,target=/root/.local/share/pnpm/store \
    pnpm config set fetch-timeout 300000 && \
    pnpm config set fetch-retries 5 && \
    pnpm config set network-concurrency 1 && \
    (pnpm install --frozen-lockfile --prod || pnpm install --frozen-lockfile --prod --registry=https://registry.npmmirror.com/)

# Copy app source code with correct non-root ownership (respecting .dockerignore)
COPY --chown=app:app . .

USER app

EXPOSE 5000

# Health check using backend /health route
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

CMD ["node", "index.js"]
