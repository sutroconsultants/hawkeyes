#!/bin/bash
# Script to initialize SSL certificates with Let's Encrypt
# Run this once on the server after DNS is configured

set -e

DOMAIN="hawkeye.sutroconsultants.com"
EMAIL="max@sutroconsultants.com"

echo "=== SSL Certificate Setup for $DOMAIN ==="

# Check if certificates already exist
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "Certificates already exist for $DOMAIN"
    exit 0
fi

# Use the init config (HTTP only) for initial setup
echo "Using HTTP-only config for initial setup..."
cp nginx/nginx-init.conf nginx/nginx.conf

# Start nginx with HTTP-only config
echo "Starting services..."
docker-compose -f docker-compose.prod.yml up -d nginx web clickhouse

# Wait for nginx to be ready
echo "Waiting for nginx..."
sleep 5

# Request certificate
echo "Requesting certificate from Let's Encrypt..."
docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

# Check if certificate was obtained
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    # Check in docker volume
    CERT_EXISTS=$(docker-compose -f docker-compose.prod.yml exec certbot test -d /etc/letsencrypt/live/$DOMAIN && echo "yes" || echo "no")
    if [ "$CERT_EXISTS" != "yes" ]; then
        echo "ERROR: Certificate was not obtained"
        exit 1
    fi
fi

echo "Certificate obtained successfully!"

# Switch to full SSL config
echo "Switching to SSL config..."
cat > nginx/nginx.conf << 'EOF'
upstream web {
    server web:7900;
}

server {
    listen 80;
    server_name hawkeye.sutroconsultants.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name hawkeye.sutroconsultants.com;

    ssl_certificate /etc/letsencrypt/live/hawkeye.sutroconsultants.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hawkeye.sutroconsultants.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://web;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
EOF

# Reload nginx with SSL config
echo "Reloading nginx with SSL..."
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload

echo "=== SSL Setup Complete ==="
echo "Your site should now be available at https://$DOMAIN"
