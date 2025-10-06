# Étape 1: Utiliser une image Node.js de base
FROM node:16-alpine

# Étape 2: Définir le répertoire de travail dans le container
WORKDIR /breezy

# Étape 3: Copier les fichiers de configuration du projet
COPY package*.json ./

# Étape 4: Installer les dépendances
RUN npm install

# Étape 5: Copier le reste des fichiers du projet React
COPY . ./

# Étape 6: Construire l'application React pour la production
RUN npm run build

# Étape 7: Exposer le port 3000
EXPOSE 3000

# Étape 8: Commande pour démarrer l'application
CMD ["npm", "start"]
