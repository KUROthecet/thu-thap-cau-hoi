FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy vao thu muc templates de Nginx tu dong doc bien moi truong
COPY nginx.conf /etc/nginx/templates/default.conf.template
EXPOSE 80
