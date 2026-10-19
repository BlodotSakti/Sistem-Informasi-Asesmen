#!/bin/sh
set -e

# Sesuaikan port Nginx jika Render menggunakan port dinamis (PORT env)
if [ -n "$PORT" ]; then
    sed -i "s/listen 80;/listen $PORT;/g" /etc/nginx/http.d/default.conf 2>/dev/null || true
    sed -i "s/listen 80;/listen $PORT;/g" /etc/nginx/conf.d/default.conf 2>/dev/null || true
fi

# Pastikan folder storage & cache siap
mkdir -p /var/www/storage/framework/cache/data
mkdir -p /var/www/storage/framework/sessions
mkdir -p /var/www/storage/framework/views
mkdir -p /var/www/storage/logs
chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

# Buat symbolic link storage jika belum ada
php artisan storage:link --force || true

# Jalankan migrasi database otomatis saat start
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Running migrations..."
    php artisan migrate --force || true
fi

# Cache konfigurasi Laravel untuk performa produksi
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

# Jalankan PHP-FPM di background
php-fpm -D

# Jalankan Nginx di foreground
exec nginx -g "daemon off;"
