# Single-image production build for the RustDesk download portal.
#
# Build:   docker build -t rustdesk-download:local .
# Run:     docker run -d -p 8080:80 -v $PWD/downloads:/srv/downloads rustdesk-download:local
# Browse:  http://localhost:8080

# ---------- Stage 1: build the Vite SPA ----------
FROM node:20-bookworm-slim AS frontend

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

COPY . .
ENV NODE_ENV=production
RUN npm run build && find dist -name '*.map' -delete

# ---------- Stage 2: nginx ----------
FROM nginx:1.27-alpine

# Replace default site with ours.
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Vite output → nginx web root.
COPY --from=frontend /app/dist /usr/share/nginx/html

# Empty downloads dir so /downloads/ resolves even before a volume is mounted.
RUN mkdir -p /srv/downloads

EXPOSE 80

# Default CMD inherited from nginx:alpine.
