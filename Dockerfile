FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --omit=dev
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npx tsc -p tsconfig.json

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy backend runtime
COPY --from=build /app/backend/dist /app/backend/dist
COPY --from=build /app/backend/node_modules /app/backend/node_modules
COPY --from=build /app/backend/package.json /app/backend/package.json

# Install node in nginx image to run backend
RUN apk add --no-cache nodejs npm

# Data directory for configs, users, collections, files
VOLUME ["/data"]
ENV DATA_DIR=/data
ENV PORT=3001
ENV JWT_SECRET=change-me-in-production

EXPOSE 80 3001

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
