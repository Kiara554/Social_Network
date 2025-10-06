// Importation du module 'express' pour créer une application web
const express = require('express');
const cors = require('cors');
const path = require('path');


// Création d'une instance de l'application Express
const app = express();
const mongoose = require('mongoose');

require('dotenv').config();

// Définition du port sur lequel le serveur écoutera les requêtes
const port = 3000;

app.use(cors()); // Utilisation du middleware CORS pour permettre les requêtes cross-origin
app.use(express.json());

// Configuration pour récupérer l'IP réelle du client derrière un proxy/load balancer
app.set('trust proxy', true);
// Toutes les requêtes commençant par '/api/tasks' seront dirigées vers le module de routes défini dans 'breez.routes.js'
app.use('/api/tasks', require('./routes/breez.routes'));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Définition d'une route GET pour la racine du site ('/')
// Lorsque quelqu'un accède à cette route, une réponse "Hello World!" est envoyée
app.get('/', (req, res) => {
    res.send('Hello julien2!');
});

// Lancement du serveur pour écouter les requêtes sur le port spécifié
// Lorsque le serveur démarre, un message est affiché dans la console
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

// Connexion à la base de données MongoDB avec les informations d'identification de l'environnement.
mongoose
  //.connect("mongodb://root:admin" + "@" + process.env.MONGO_HOST + ":" + process.env.MONGO_PORT + "/" + process.env.MONGO_DATABASE_NAME)
  .connect("mongodb://api-user:ProjetX92000@98.66.153.160:27018/DATA")
  .then(() => {
    // Affiche un message de succès lorsque la connexion est établie.
    console.log("MongoDB connected !"); 

    // Démarre l'application sur le port spécifié.
    app.listen(port, () => {
      console.log(`App listening on port ${port}`);
    });
  })
  .catch((err) => {
    // Affiche une erreur si la connexion échoue.
    console.log(err);
  });
