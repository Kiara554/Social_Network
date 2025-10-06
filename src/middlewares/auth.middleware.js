const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        // Récupérer le token depuis l'en-tête Authorization
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                error: 'Token d\'authentification manquant'
            });
        }

        // Vérifier le format du token (Bearer token)
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Format de token invalide. Utilisez: Bearer <token>'
            });
        }

        // Extraire le token
        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                error: 'Token manquant'
            });
        }

        // Vérifier et décoder le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
        
        // Ajouter les informations de l'utilisateur à la requête (incluant l'empreinte)
        req.user = {
            userId: decoded.userId,
            username: decoded.username,
            email: decoded.email,
            fingerprint: decoded.fingerprint, // Empreinte extraite du token
            two_factor_auth: decoded.two_factor_auth,
            auth_complete: decoded.auth_complete
        };

        // Passer au middleware suivant
        next();
        
    } catch (error) {
        // Token invalide ou expiré
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expiré'
            });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Token invalide'
            });
        } else {
            return res.status(401).json({
                error: 'Erreur d\'authentification'
            });
        }
    }
}; 