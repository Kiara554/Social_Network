const mysql = require('mysql2');

const pool = mysql.createPool({
  host: '98.66.153.160',
  user: 'root',
  password: 'root123',
  database: 'breezy_auth',
  port: 3013,
  waitForConnections: true,
  connectionLimit: 10, 
  queueLimit: 0
});

// Test de la connexion au démarrage
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Échec de la connexion initiale à MySQL :', err.message);
    
  } else {
    console.log('✅ Connexion initiale à MySQL établie avec succès !');
    connection.release(); // Relâche la connexion immédiatement si ce n'était qu'un test
  }
});

module.exports = pool.promise(); // pour pouvoir utiliser async/await