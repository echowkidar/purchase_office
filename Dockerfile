FROM node:22-alpine AS base

# ──────── Dependencies ────────
FROM base AS deps
WORKDIR /app
COPY package.json ./
COPY prisma ./prisma
RUN npm install



# ──────── Builder ────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma generate needs a dummy DATABASE_URL at build time (not actual connection)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

RUN npx prisma generate
RUN npm run build

# ──────── Runner ────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
RUN mkdir -p ./public/uploads && chown -R nextjs:nodejs ./public

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Create startup script that applies DB migrations then starts the app
RUN printf '#!/bin/sh\necho "Applying database schema..."\nnpx prisma db push --skip-generate --accept-data-loss 2>&1 || echo "Warning: prisma db push failed, continuing..."\necho "Starting server..."\nnode server.js\n' > /app/start.sh && chmod +x /app/start.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "/app/start.sh"]

