const db = require('../config/sql');

module.exports = async (req, res, next) => {
    try {
        const userId = req.userId; // Supposé être défini par votre middleware d'authentification
        const [user] = await db.query('SELECT role FROM users WHERE user_id = ?', [userId]);

        if (!user || user[0].role !== 'admin') {
            return res.status(403).json({ error: 'Accès non autorisé' });
        }

        next();
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la vérification des droits' });
    }
};