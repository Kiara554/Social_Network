#!/bin/bash

# ───────────────────────────────────────────────────────
# Script pour générer les certificats SSL avec Certbot
# via Docker Compose (webroot method)
# ───────────────────────────────────────────────────────

echo "🚀 Lancement de la génération des certificats SSL..."

docker compose run --rm certbot

# Vérification du succès
if [ $? -eq 0 ]; then
    echo "✅ Certificats SSL générés avec succès !"
    echo "📂 Vérifiez le dossier ./certbot-etc/live/"
else
    echo "❌ Échec de la génération des certificats SSL."
    echo "🛠️ Vérifiez vos DNS et que NGINX tourne bien sur le port 80."
fi
