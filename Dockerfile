FROM node:20-alpine AS build
WORKDIR /app

# Install root dependencies and build frontend
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

# Install backend dependencies and compile TypeScript
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --omit=dev
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npx tsc -p tsconfig.json

# Final runtime image
FROM node:20-alpine
WORKDIR /app

# Copy built frontend
COPY --from=build /app/dist ./dist

# Copy compiled backend and node_modules
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/node_modules ./backend/node_modules
COPY --from=build /app/backend/package.json ./backend/package.json

# Data directory for configs, users, collections, files
VOLUME ["/data"]
ENV DATA_DIR=/data
ENV PORT=3001

EXPOSE 3001

CMD ["node", "backend/dist/server.js"]
