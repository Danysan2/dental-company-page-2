# ── Stage 1: Dependencies ─────────────────────────────────────
FROM node:20-alpine AS deps

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm ci --prefer-offline

# ── Stage 2: Builder ──────────────────────────────────────────
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG DATABASE_URL
ARG NEXT_PUBLIC_EMAILJS_SERVICE_ID
ARG NEXT_PUBLIC_EMAILJS_TEMPLATE_PACIENTE
ARG NEXT_PUBLIC_EMAILJS_TEMPLATE_CLINICA
ARG NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
ARG NEXT_PUBLIC_CLINICA_EMAIL
ARG JWT_SECRET

ENV DATABASE_URL=$DATABASE_URL
ENV NEXT_PUBLIC_EMAILJS_SERVICE_ID=$NEXT_PUBLIC_EMAILJS_SERVICE_ID
ENV NEXT_PUBLIC_EMAILJS_TEMPLATE_PACIENTE=$NEXT_PUBLIC_EMAILJS_TEMPLATE_PACIENTE
ENV NEXT_PUBLIC_EMAILJS_TEMPLATE_CLINICA=$NEXT_PUBLIC_EMAILJS_TEMPLATE_CLINICA
ENV NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=$NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
ENV NEXT_PUBLIC_CLINICA_EMAIL=$NEXT_PUBLIC_CLINICA_EMAIL
ENV JWT_SECRET=$JWT_SECRET

RUN npx prisma generate
RUN npm run build

# ── Stage 3: Runner ───────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Standalone build
COPY --from=builder /app/public                         ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static

# Prisma runtime files
COPY --from=builder /app/node_modules/.prisma           ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma           ./node_modules/@prisma

# Seed script + its deps
COPY --from=builder /app/prisma                         ./prisma
COPY --from=builder /app/node_modules/bcryptjs          ./node_modules/bcryptjs
COPY --from=builder /app/node_modules/@prisma           ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma            ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin/prisma       ./node_modules/.bin/prisma

# Entrypoint script
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "docker-entrypoint.sh"]
