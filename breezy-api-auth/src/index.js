// Importation du module 'express' pour créer une application web
const express = require('express');
const cors = require('cors');
const session = require('express-session');
// Importation du module 'mysql2' pour intéragir avec MySQL
const mysql = require('mysql2');

// Importation du module path pour gérer les chemins
const path = require('path');

// Charge les variables d'environnement à partir d'un fichier env
const envPath = path.join(__dirname, '..', '.env');
const dotenvResult = require('dotenv').config({ path: envPath });

if (dotenvResult.error) { 
    console.error('Error loading .env file:', dotenvResult.error);
    process.exit(1);
}

// Import the auth model to initialize the users table
const { initUsersTable } = require('./models/auth.model');

// Import database monitor
const DatabaseMonitor = require('./utils/dbMonitor');

// Création d'une instance de l'application Express
const app = express();

// Gestion des CORS
app.use(cors());
// {
//   origin: process.env.FRONTEND_URL,
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }

// Définition d'un port sur lequel le serveur écoutera les requêtes
const port = 3000

// Middleware pour parser le corps des requêtes au format JSON
app.use(express.json());

// Configuration des sessions
app.use(session({
    secret: process.env.SESSION_SECRET || 'breezy-session-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 heures
    }
}));

// Configuration du pool de connexions MySQL avec reconnexion automatique
const dbConfig = {
    host: process.env.DB_HOST || 'mysql',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'breezy',
    password: process.env.DB_PASSWORD || 'breezy123',
    database: process.env.DB_DATABASE || 'breezy_auth',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
    acquireTimeout: parseInt(process.env.DB_TIMEOUT) || 60000,
    timeout: parseInt(process.env.DB_TIMEOUT) || 60000,
    reconnect: true,
    idleTimeout: 300000, // 5 minutes
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};

// Création du pool de connexions
const pool = mysql.createPool(dbConfig);

// Fonction pour tester la connexion à la base de données
const testDatabaseConnection = () => {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                console.error('Error getting connection from pool:', err);
                reject(err);
                return;
            }
            
            connection.ping((pingErr) => {
                connection.release();
                if (pingErr) {
                    console.error('Error pinging database:', pingErr);
                    reject(pingErr);
                    return;
                }
                resolve();
            });
        });
    });
};

// Fonction d'initialisation de la base de données avec retry
const initializeDatabase = async (retries = 5) => {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`Attempting to connect to database (attempt ${i + 1}/${retries})...`);
            await testDatabaseConnection();
            console.log('Connected to MySQL database successfully');
            
            // Initialize the users table
            await initUsersTable(pool);
            console.log('Users table initialized successfully');
            return;
        } catch (error) {
            console.error(`Database connection attempt ${i + 1} failed:`, error.message);
            if (i === retries - 1) {
                console.error('All database connection attempts failed. Exiting...');
                process.exit(1);
            }
            // Attendre 5 secondes avant de retry
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
};

// Make database pool available globally
global.db = pool;

// Initialiser le monitoring de la base de données
const dbMonitor = new DatabaseMonitor(pool);


// Route de health check
app.get('/health', (req, res) => {
    pool.getConnection((err, connection) => {
        if (err) {
            return res.status(503).json({ 
                status: 'error', 
                message: 'Database connection failed',
                error: err.message 
            });
        }
        
        connection.ping((pingErr) => {
            connection.release();
            if (pingErr) {
                return res.status(503).json({ 
                    status: 'error', 
                    message: 'Database ping failed',
                    error: pingErr.message 
                });
            }
            
            res.status(200).json({ 
                status: 'ok', 
                message: 'Service is healthy',
                database: 'connected',
                stats: dbMonitor.getPoolStats()
            });
        });
    });
});

// Toutes les requêtes commançant par '/api/auth' seront redirigées vers le module de routes défini dans 'auth.routes.js'
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/users.routes'));

app.get('/', (req, res) => {
  res.send('Bienvenue sur l\'API de Breezy Auth')
})

// Gestion gracieuse de l'arrêt
process.on('SIGINT', () => {
    console.log('Received SIGINT. Stopping monitoring and closing database pool...');
    dbMonitor.stopMonitoring();
    pool.end(() => {
        console.log('Database pool closed.');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Stopping monitoring and closing database pool...');
    dbMonitor.stopMonitoring();
    pool.end(() => {
        console.log('Database pool closed.');
        process.exit(0);
    });
});

// Initialisation de la base de données et démarrage du serveur
initializeDatabase().then(() => {
    // Démarrer le monitoring de la base de données
    dbMonitor.startMonitoring(60000); // Vérification toutes les minutes
    
    // Démarrage du serveur sur le port spécifié
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`)
    });
}).catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
});



