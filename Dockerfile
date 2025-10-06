FROM node:18-alpine

# Création du répertoire de travail
WORKDIR /app

# Installation des dépendances système si nécessaire
RUN apk add --no-cache dumb-init

# Copie des fichiers package
COPY package*.json ./

# Installation des dépendances
RUN npm install --omit=dev && npm cache clean --force

# Copie du code source
COPY . .

# Création d'un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeuser -u 1001

# Attribution des permissions
RUN chown -R nodeuser:nodejs /app
USER nodeuser

# Exposition du port
EXPOSE 3000

# Commande de démarrage
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js"]
