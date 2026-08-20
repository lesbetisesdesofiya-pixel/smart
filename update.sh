#!/bin/bash
# ClassiNote - Script de mise à jour automatique
# Usage: bash update.sh

set -e

echo "🔄 Mise à jour de ClassiNote..."

cd /var/www/smart

echo "📥 Récupération des derniers fichiers..."
git pull origin main

echo "🛑 Arrêt des conteneurs..."
docker-compose down

echo "🔨 Reconstruction et démarrage..."
docker-compose up -d --build

echo "⏳ Attente du démarrage de MySQL..."
sleep 10

echo "🗄️ Migrations de la base de données..."
docker-compose exec -T app php artisan migrate --force

echo "🧹 Nettoyage du cache..."
docker-compose exec -T app php artisan config:cache
docker-compose exec -T app php artisan route:cache
docker-compose exec -T app php artisan view:cache

echo "✅ Mise à jour terminée !"
echo "🌐 Application disponible sur http://$(hostname -I | awk '{print $1}')"
