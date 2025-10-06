FROM node:18

# Crée le dossier d'app
WORKDIR /app

# Copie les fichiers du projet
COPY package*.json ./
RUN npm install

COPY . .

# Expose le port 3000
EXPOSE 3060

# Commande de démarrage
CMD ["npm", "start"]
