const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');

// Fonction utilitaire pour exécuter des requêtes avec le pool
const executeQuery = (query, params = []) => {
    return new Promise((resolve, reject) => {
        global.db.getConnection((err, connection) => {
            if (err) {
                console.error('Error getting connection from pool:', err);
                reject(err);
                return;
            }
            
            connection.query(query, params, (queryErr, results) => {
                connection.release(); // Libérer la connexion dans le pool
                
                if (queryErr) {
                    console.error('Query error:', queryErr);
                    reject(queryErr);
                } else {
                    resolve(results);
                }
            });
        });
    });
};

// Fonction pour retry une requête en cas d'erreur de connexion
const executeQueryWithRetry = async (query, params = [], maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await executeQuery(query, params);
        } catch (error) {
            console.error(`Query attempt ${attempt} failed:`, error.message);
            
            // Si c'est une erreur de connexion et qu'il reste des tentatives
            if (attempt < maxRetries && (
                error.code === 'PROTOCOL_CONNECTION_LOST' ||
                error.code === 'ECONNREFUSED' ||
                error.code === 'ETIMEDOUT'
            )) {
                console.log(`Retrying query in 1 second... (attempt ${attempt + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            }
            
            // Si c'est la dernière tentative ou une erreur non-retryable
            throw error;
        }
    }
};

module.exports = {
    getAllUsers: async (req, res) => {
        try {
            console.log('getAllUsers: Starting query...');
            const users = await executeQueryWithRetry('SELECT user_id,login as email, username FROM users');
            console.log('getAllUsers: Query result:', users);
            console.log('getAllUsers: Number of users found:', users.length);
            res.status(200).json(users);
        } catch (error) {
            console.error('getAllUsers: Error occurred:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
        }
    },
    updateIdentifiers: async (req, res) => {
        try {
            const { email, username } = req.body;

            const user_id = req.params.user_id

            const users = await executeQueryWithRetry('UPDATE users SET login = ?, username = ? WHERE user_id = ?', [email, username, user_id]);
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la mise à jour des identifiants' });
        }
    },

    updateIsBanned: async (req, res) => {
        try {
            const { ban } = req.body;

            const user_id = req.params.user_id

            const users = await executeQueryWithRetry('UPDATE users SET is_banned = ? WHERE user_id = ?', [ban, user_id]);
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la mise à jour des identifiants' });
        }
    },

    getUserById: async (req, res) => {
        try {
            const { user_id } = req.params;
            console.log('user_id', user_id);
            try {
                const users = await executeQueryWithRetry('SELECT user_id,login as email, username, role, is_banned FROM users WHERE user_id = ?', [user_id]);

                res.status(200).json(users);


            } catch (error) {
                console.error('getUserById: Error occurred:', error);
                res.status(404).json({ error: `L'utilisateur avec l'id ${user_id} n'existe pas` });
            }
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la récupération de l\'utilisateur' });
        }
    },
}