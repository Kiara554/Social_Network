# Utiliser une image Node.js officielle
FROM node:18

# Créer et définir le répertoire de travail
WORKDIR /app
# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances du projet
RUN npm install

# Copier les fichiers et dossiers du projet
COPY . .

# Exposer le port sur lequel le serveur websocket écoute
EXPOSE 3099

# Commande pour démarrer le serveur
CMD [ "node", "websocket-server/server.js" ]