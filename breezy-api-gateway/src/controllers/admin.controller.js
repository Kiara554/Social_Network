const db = require('../config/sql');

const adminController = {
    // Récupérer tous les utilisateurs avec leurs statistiques
    getAllUsers: async (req, res) => {
        const sql = `
            SELECT 
                u.user_id,
                u.username,
                u.email,
                u.created_at,
                u.url_profil_picture,
                u.is_banned,
                u.banned_reason,
                u.last_login,
                u.login_count,
                COUNT(DISTINCT b.breez_id) as post_count,
                COUNT(DISTINCT c.comment_id) as comment_count,
                COUNT(DISTINCT l.like_id) as like_count,
                COUNT(DISTINCT f1.id) as follower_count,
                COUNT(DISTINCT f2.id) as following_count
            FROM users u
            LEFT JOIN breez b ON u.user_id = b.author_id
            LEFT JOIN comments c ON u.user_id = c.author_id
            LEFT JOIN likes l ON u.user_id = l.author_id
            LEFT JOIN followers f1 ON u.user_id = f1.followed_id
            LEFT JOIN followers f2 ON u.user_id = f2.follower_id
            GROUP BY u.user_id
            ORDER BY u.created_at DESC
        `;

        try {
            const [users] = await db.query(sql);
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
        }
    },

    // Obtenir les détails d'un utilisateur spécifique
    getUserDetails: async (req, res) => {
        const userId = req.params.id;
        const sql = `
            SELECT 
                u.*,
                GROUP_CONCAT(DISTINCT b.breez_id) as post_ids,
                GROUP_CONCAT(DISTINCT c.comment_id) as comment_ids,
                GROUP_CONCAT(DISTINCT l.breez_id) as liked_post_ids
            FROM users u
            LEFT JOIN breez b ON u.user_id = b.author_id
            LEFT JOIN comments c ON u.user_id = c.author_id
            LEFT JOIN likes l ON u.user_id = l.author_id
            WHERE u.user_id = ?
            GROUP BY u.user_id
        `;

        try {
            const [user] = await db.query(sql, [userId]);
            res.json(user[0]);
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la récupération des détails' });
        }
    },

    // Bannir un utilisateur
    banUser: async (req, res) => {
        const { userId, reason } = req.body;
        const sql = `
            UPDATE users 
            SET is_banned = TRUE,
                banned_at = NOW(),
                banned_reason = ?
            WHERE user_id = ?
        `;

        try {
            await db.query(sql, [reason, userId]);
            res.json({ message: 'Utilisateur banni avec succès' });
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors du bannissement' });
        }
    },

    // Débannir un utilisateur
    unbanUser: async (req, res) => {
        const userId = req.params.id;
        const sql = `
            UPDATE users 
            SET is_banned = FALSE,
                banned_at = NULL,
                banned_reason = NULL
            WHERE user_id = ?
        `;

        try {
            await db.query(sql, [userId]);
            res.json({ message: 'Utilisateur débanni avec succès' });
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors du débannissement' });
        }
    },

    // Statistiques générales
    getStats: async (req, res) => {
        try {
            const [[userCount]] = await db.query('SELECT COUNT(*) as count FROM users WHERE role = "user"');
            const [[postCount]] = await db.query('SELECT COUNT(*) as count FROM breez');
            const [[commentCount]] = await db.query('SELECT COUNT(*) as count FROM comments');
            const [[bannedCount]] = await db.query('SELECT COUNT(*) as count FROM users WHERE is_banned = TRUE');

            res.json({
                userCount: userCount.count,
                postCount: postCount.count,
                commentCount: commentCount.count,
                bannedCount: bannedCount.count
            });
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
        }
    }
};

module.exports = adminController;