const mysql = require('mysql2');

// Définition du schéma de la table users
const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
  user_id INT NOT NULL AUTO_INCREMENT,
  login VARCHAR(100) NOT NULL UNIQUE,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  two_factor_secret VARCHAR(255) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME DEFAULT NULL,
  last_login DATETIME DEFAULT NULL,
  PRIMARY KEY (user_id),
  UNIQUE KEY unique_login (login),
  UNIQUE KEY unique_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

// Fonction pour initialiser la table avec un pool de connexions
const initUsersTable = (pool) => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        reject(err);
        return;
      }
      
      connection.query(createUsersTable, (queryErr, results) => {
        connection.release(); // Libérer la connexion dans le pool
        
        if (queryErr) {
          reject(queryErr);
        } else {
          resolve(results);
        }
      });
    });
  });
};

module.exports = {
  createUsersTable,
  initUsersTable
};