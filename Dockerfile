# ==========================================
# Stage 1: Build React Frontend dengan Vite
# ==========================================
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ==========================================
# Stage 2: PHP Application & Nginx
# ==========================================
FROM php:8.3-fpm-alpine

# Install dependencies sistem
RUN apk add --no-cache \
    nginx \
    curl \
    zip \
    unzip \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev \
    oniguruma-dev \
    libxml2-dev

# Konfigurasi & install ekstensi PHP yang dibutuhkan Laravel
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_mysql mbstring gd zip bcmath xml opcache

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Copy kode proyek
COPY . .

# Copy hasil build frontend dari Stage 1
COPY --from=frontend /app/public/build ./public/build

# Install dependensi PHP untuk produksi
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Permissions folder storage & cache
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache \
    && chmod -R 775 /var/www/storage /var/www/bootstrap/cache

# Konfigurasi Nginx & Entrypoint Script
COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

# Normalisasi line endings (CRLF to LF) dan berikan izin execute
RUN sed -i 's/\r$//' /usr/local/bin/entrypoint.sh \
    && chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
