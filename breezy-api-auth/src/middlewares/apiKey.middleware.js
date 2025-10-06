module.exports = (req, res, next) => {
    try {
        // Récupérer la clé API depuis l'en-tête X-API-KEY
        const apiKey = req.headers['x-api-key'];
        
        if (!apiKey) {
            return res.status(401).json({
                error: 'Clé API manquante. En-tête X-API-KEY requis.'
            });
        }

        // Vérifier la clé API (vous pouvez avoir plusieurs clés pour différentes applications)
        const validApiKeys = [
            process.env.API_KEY_FRONTEND || '$key&frontend£breezy/2025/yb$*$$$daz*$bdz££bd=+zj',
            process.env.API_KEY_MOBILE || '$key&mobile£breezy/2025/dajgda$$*dzhz£^^dz',

            // Ajoutez d'autres clés selon vos besoins
        ];

        if (!validApiKeys.includes(apiKey)) {
            return res.status(403).json({
                error: 'Clé API invalide'
            });
        }

        // Optionnel : Ajouter des informations sur l'application qui fait la requête
        req.apiClient = {
            key: apiKey,
            type: apiKey.includes('frontend') ? 'frontend' : 
                  apiKey.includes('mobile') ? 'mobile' : 'unknown'
        };

        next();
        
    } catch (error) {
        return res.status(500).json({
            error: 'Erreur de vérification de la clé API'
        });
    }
}; 