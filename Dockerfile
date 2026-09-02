FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS backend
WORKDIR /app
COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm install --omit=dev
COPY backend ./backend

FROM nginx:1.27-alpine AS frontend
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

FROM node:20-alpine
WORKDIR /app
COPY --from=backend /app/backend ./backend
COPY --from=frontend /usr/share/nginx/html ./dist
EXPOSE 3001
ENV PORT=3001
CMD ["node", "backend/src/server.js"]
