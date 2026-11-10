# Build stage
FROM node:22-alpine AS build-stage

WORKDIR /app

# Prefer IPv4 DNS resolution to avoid socket timeouts/hangs inside Docker
ENV NODE_OPTIONS="--dns-result-order=ipv4first"
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Install pnpm via npm with mirror fallback (avoids flaky corepack fetch)
RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm@10.23.0 || npm install -g pnpm@10.23.0 --registry=https://registry.npmmirror.com/

# Copy dependency manifests and configuration first
COPY package.json pnpm-lock.yaml .npmrc* ./

# Install dependencies with cache mount and resilient network settings (with mirror fallback)
RUN --mount=type=cache,id=pnpm-frontend-store,target=/root/.local/share/pnpm/store \
    pnpm config set fetch-timeout 300000 && \
    pnpm config set fetch-retries 5 && \
    pnpm config set network-concurrency 1 && \
    (pnpm install --frozen-lockfile || pnpm install --frozen-lockfile --registry=https://registry.npmmirror.com/)

# Copy app source code (respecting .dockerignore)
COPY . .

# Build arguments for Vite with default fallbacks
ARG VITE_API_URL=""
ARG VITE_COGNITO_USER_POOL_ID=""
ARG VITE_COGNITO_CLIENT_ID=""
ARG VITE_COGNITO_DOMAIN=""
ARG VITE_REDIRECT_SIGN_IN=""
ARG VITE_REDIRECT_SIGN_OUT=""

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_COGNITO_USER_POOL_ID=$VITE_COGNITO_USER_POOL_ID
ENV VITE_COGNITO_CLIENT_ID=$VITE_COGNITO_CLIENT_ID
ENV VITE_COGNITO_DOMAIN=$VITE_COGNITO_DOMAIN
ENV VITE_REDIRECT_SIGN_IN=$VITE_REDIRECT_SIGN_IN
ENV VITE_REDIRECT_SIGN_OUT=$VITE_REDIRECT_SIGN_OUT

# Warn if Cognito variables are missing rather than abruptly failing local builds
RUN if [ -z "$VITE_COGNITO_USER_POOL_ID" ]; then \
      echo ">> WARNING: VITE_COGNITO_USER_POOL_ID is not provided. Auth will be disabled in this build."; \
    fi

RUN pnpm run build

# Production stage
FROM nginx:1.26-alpine AS production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --spider -q http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
