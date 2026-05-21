# Use lightweight Node image
FROM node:22-alpine

WORKDIR /app

# Copy only dependency files first (for caching)
COPY package.json pnpm-lock.yaml ./

# Enable corepack and activate the exact pnpm version
RUN corepack enable && corepack prepare pnpm@10.23.0 --activate

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy app source code
COPY . .

# Create non-root user for security
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

# Expose port
EXPOSE 5000

# Health check (uses your /health route)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Start app
CMD ["node", "index.js"]
