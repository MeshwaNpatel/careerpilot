FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
# Install all deps (including prisma CLI) so migrate commands work at runtime
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src
COPY server.js ./

EXPOSE 5000

# Resolve any dirty (failed) migrations left by crashed previous deploys,
# then apply pending migrations, then start the server.
CMD ["sh", "-c", "npx prisma migrate resolve --rolled-back '20260626000000_add_activity_logs' 2>/dev/null; npx prisma migrate deploy && node server.js"]
