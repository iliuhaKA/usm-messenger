# Стадия 1: сборка статики
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci
COPY . .

ARG VITE_API_URL=https://localhost:8443/api
ARG VITE_BACKEND_ORIGIN=https://localhost:8443
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_BACKEND_ORIGIN=$VITE_BACKEND_ORIGIN
RUN npm run build

# Стадия 2: раздача статики через nginx + TLS
FROM nginx:alpine

# openssl для генерации self-signed сертификата
RUN apk add --no-cache openssl && \
    mkdir -p /etc/nginx/certs && \
    openssl req -x509 -nodes \
        -newkey rsa:2048 \
        -days 365 \
        -keyout /etc/nginx/certs/key.pem \
        -out /etc/nginx/certs/cert.pem \
        -subj "/CN=localhost/O=USM/C=MD" \
        -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 443
CMD ["nginx", "-g", "daemon off;"]
