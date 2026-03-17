# Stage 1: Build dashboard
FROM node:22-alpine AS dashboard-build
WORKDIR /app/dashboard
COPY dashboard/package.json dashboard/package-lock.json ./
RUN npm ci
COPY dashboard/ ./
RUN npm run build

# Stage 2: Production
FROM node:22-alpine
WORKDIR /app

# Install agent production dependencies
COPY agent/package.json agent/package-lock.json ./agent/
RUN cd agent && npm ci --omit=dev

# Copy agent source and build
COPY agent/ ./agent/
RUN cd agent && npx tsc

# Copy dashboard build output
COPY --from=dashboard-build /app/dashboard/dist ./dashboard/dist

EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "agent/dist/index.js"]
