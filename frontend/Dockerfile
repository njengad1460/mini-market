# Build stage
FROM node:22-alpine AS build-stage

WORKDIR /app

# Copy manifests first so corepack can read the "packageManager" field
COPY package.json pnpm-lock.yaml ./

# Enable corepack and activate the exact pnpm version
RUN corepack enable && corepack prepare pnpm@10.23.0 --activate

RUN pnpm install --frozen-lockfile

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm run build

# Production stage
FROM nginx:1.26-alpine AS production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
