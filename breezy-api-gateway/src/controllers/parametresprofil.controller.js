const db = require('../config/sql');
const Follow = require('../models/follow.model');

module.exports = {

    getProfileFromSQL: async (req, res) => {
        const userId = req.params.id;
        console.log(`Tentative de récupération du profil pour l'utilisateur ID: ${userId}`);

        const sql = `
        SELECT user_id,
        login              AS email,
        username           AS authorName,
        url_profil_picture AS profilePicture,
        biographie
        FROM users
        WHERE user_id = ?
`;


        const SQL_QUERY_TIMEOUT = 5000; // 5 secondes en millisecondes

        try {
            // Utilisez await et la déstructuration pour obtenir les résultats
            // Le second élément du tableau 'fields' contient les métadonnées, souvent non utilisées directement.
            const [results] = await db.query({ // <-- Plus de callback ici
                sql: sql,
                values: [userId],
                timeout: SQL_QUERY_TIMEOUT
            });

            console.log(`✅ Requête MySQL réussie pour l'utilisateur ID: ${userId}.`);

            if (results.length === 0) {
                console.log(`⚠️ Utilisateur ID ${userId} non trouvé dans MySQL.`);
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }

            console.log(`👍 Données utilisateur trouvées dans MySQL pour l'ID ${userId}.`);
            const user = results[0];

            const MONGODB_QUERY_TIMEOUT = 3000;

            // La logique Promise.race pour MongoDB est déjà compatible async/await
            const timeoutPromise = new Promise((resolve, reject) =>
                setTimeout(() => reject(new Error('Timeout de la requête MongoDB')), MONGODB_QUERY_TIMEOUT)
            );

            const [followers, following] = await Promise.all([
                Promise.race([
                    Follow.countDocuments({ authorIdFollowed: userId }),
                    timeoutPromise
                ]),
                Promise.race([
                    Follow.countDocuments({ authorId: userId }),
                    timeoutPromise
                ])
            ]);

            console.log(`✅ Requêtes MongoDB (follows) réussies pour l'utilisateur ID: ${userId}.`);

            res.status(200).json({
                ...user,
                followers,
                following
            });

        } catch (err) {
            // Gérer les erreurs de MySQL ET de MongoDB dans ce bloc catch
            if (err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' || err.code === 'ETIMEDOUT') {
                console.error(`❌ Timeout ou erreur de connexion MySQL pour l'ID ${userId} :`, err);
                return res.status(504).json({ error: 'Problème de base de données ou Timeout', details: err.message });
            }
            if (err.message === 'Timeout de la requête MongoDB') {
                console.error(`❌ Timeout de la requête MongoDB (follows) pour l'utilisateur ID ${userId}.`);
                return res.status(504).json({ error: 'La requête MongoDB a expiré', details: err.message });
            }
            console.error(`❌ Erreur inattendue dans getProfileFromSQL pour l'ID ${userId} :`, err);
            return res.status(500).json({ error: 'Erreur interne du serveur', details: err.message });
        }
    },

updateProfileInSQL: async (req, res) => {
    const userId = req.params.id;
    const { authorName, profilePicture, biographie } = req.body;

    console.log(`🔧 Updating profile for user ID: ${userId}`);
    console.log(`New authorName: ${authorName}, New profilePicture: ${profilePicture}, New biographie: ${biographie}`);

    let sql = null;
    let params = [];

    if (authorName && profilePicture && biographie !== undefined) {
        sql = `
            UPDATE users
            SET username = ?,
                url_profil_picture = ?,
                biographie = ?,
                updated_at = NOW()
            WHERE user_id = ?
        `;
        params = [authorName, profilePicture, biographie, userId];
    } else if (authorName && profilePicture) {
        sql = `
            UPDATE users
            SET username = ?,
                url_profil_picture = ?,
                updated_at = NOW()
            WHERE user_id = ?
        `;
        params = [authorName, profilePicture, userId];
    } else if (authorName && biographie !== undefined) {
        sql = `
            UPDATE users
            SET username = ?,
                biographie = ?,
                updated_at = NOW()
            WHERE user_id = ?
        `;
        params = [authorName, biographie, userId];
    } else if (profilePicture && biographie !== undefined) {
        sql = `
            UPDATE users
            SET url_profil_picture = ?,
                biographie = ?,
                updated_at = NOW()
            WHERE user_id = ?
        `;
        params = [profilePicture, biographie, userId];
    } else if (authorName) {
        sql = `
            UPDATE users
            SET username = ?,
                updated_at = NOW()
            WHERE user_id = ?
        `;
        params = [authorName, userId];
    } else if (profilePicture) {
        sql = `
            UPDATE users
            SET url_profil_picture = ?,
                updated_at = NOW()
            WHERE user_id = ?
        `;
        params = [profilePicture, userId];
    } else if (biographie !== undefined) {
        sql = `
            UPDATE users
            SET biographie = ?,
                updated_at = NOW()
            WHERE user_id = ?
        `;
        params = [biographie, userId];
    } else {
        console.log(`⚠️ No data provided to update for user ID: ${userId}.`);
        return res.status(400).json({ message: 'No data provided for update' });
    }

    try {
        const [result] = await db.query(sql, params);

        if (result.affectedRows === 0) {
            console.log(`⚠️ User ID ${userId} not found for update.`);
            return res.status(404).json({ message: 'User not found or no changes made' });
        }

        console.log(`✅ Profile updated successfully for user ID: ${userId}.`);
        res.status(200).json({ message: 'Profile updated successfully' });
    } catch (err) {
        console.error(`❌ SQL error during profile update for ID ${userId}:`, err);
        return res.status(500).json({ error: 'SQL error during update', details: err.message });
    }
}



};
