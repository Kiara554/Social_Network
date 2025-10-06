const crypto = require('crypto');

// Fonction pour générer une empreinte basée sur les caractéristiques du client
function generateFingerprint(req) {
    const userAgent = req.headers['user-agent'] || '';
    const acceptLanguage = req.headers['accept-language'] || '';
    const acceptEncoding = req.headers['accept-encoding'] || '';
    
    // Récupérer l'IP réelle (même derrière un proxy)
    const clientIP = req.headers['x-forwarded-for'] || 
                     req.headers['x-real-ip'] || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress ||
                     (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                     req.ip;

    // Créer une chaîne unique basée sur les caractéristiques du client
    const fingerprintData = `${userAgent}|${acceptLanguage}|${acceptEncoding}|${clientIP}`;
    
    // Générer un hash SHA256 de l'empreinte
    return crypto.createHash('sha256').update(fingerprintData).digest('hex');
}

// Middleware pour générer l'empreinte lors de la connexion
const generateFingerprintMiddleware = (req, res, next) => {
    try {
        const fingerprint = generateFingerprint(req);
        req.deviceFingerprint = fingerprint;
        next();
    } catch (error) {
        return res.status(500).json({
            error: 'Erreur lors de la génération de l\'empreinte'
        });
    }
};

// Middleware pour vérifier l'empreinte lors des requêtes authentifiées
const verifyFingerprintMiddleware = (req, res, next) => {
    try {
        // SÉCURITÉ RENFORCÉE: Gestion des requêtes de l'API Gateway avec vérification d'empreinte
        const isFromApiGatewaySecure = req.headers['x-api-gateway-secure'] === 'true';
        const clientFingerprintFromGateway = req.headers['x-client-fingerprint'];
        
        // Récupérer l'empreinte stockée dans le token (ajoutée par authMiddleware)
        const storedFingerprint = req.user?.fingerprint;
        
        if (!storedFingerprint) {
            return res.status(401).json({
                error: 'Token invalide - empreinte manquante'
            });
        }
        
        let fingerprintToVerify;
        
        if (isFromApiGatewaySecure && clientFingerprintFromGateway) {
            // Requête sécurisée depuis l'API Gateway avec empreinte du client transmise
            fingerprintToVerify = clientFingerprintFromGateway;
            console.log('[FINGERPRINT] Vérification sécurisée via API Gateway');
            console.log(`[FINGERPRINT] Empreinte client transmise: ${clientFingerprintFromGateway}`);
            console.log(`[FINGERPRINT] Empreinte stockée dans token: ${storedFingerprint}`);
            console.log(`[FINGERPRINT] Headers reçus:`, {
                'user-agent': req.headers['user-agent'],
                'accept-language': req.headers['accept-language'],
                'accept-encoding': req.headers['accept-encoding'],
                'x-forwarded-for': req.headers['x-forwarded-for'],
                'x-real-ip': req.headers['x-real-ip']
            });
            
        } else if (isFromApiGatewaySecure && !clientFingerprintFromGateway) {
            // Requête depuis l'API Gateway mais sans empreinte client - REFUSER
            console.log('[FINGERPRINT] SÉCURITÉ: Requête API Gateway sans empreinte client - REFUSÉE');
            return res.status(401).json({
                error: 'Token invalide - empreinte client manquante depuis l\'API Gateway'
            });
            
        } else {
            // Requête directe du client - vérification normale
            fingerprintToVerify = generateFingerprint(req);
            console.log('[FINGERPRINT] Vérification directe du client');
        }
        
        // Vérifier que les empreintes correspondent
        if (fingerprintToVerify !== storedFingerprint) {
            console.log('[FINGERPRINT] SÉCURITÉ: Empreinte non correspondante:', {
                verified: fingerprintToVerify.substring(0, 16) + '...',
                stored: storedFingerprint.substring(0, 16) + '...',
                isFromApiGateway: isFromApiGatewaySecure,
                userAgent: req.headers['user-agent'],
                clientIP: req.headers['x-forwarded-for'] || req.ip
            });
            
            return res.status(401).json({
                error: 'Token invalide - empreinte non correspondante. Connexion depuis un autre appareil détectée.'
            });
        }
        
        console.log('[FINGERPRINT] ✅ Empreinte vérifiée avec succès');
        if (isFromApiGatewaySecure) {
            console.log('[FINGERPRINT] ✅ Requête sécurisée validée via API Gateway');
        }
        
        next();
    } catch (error) {
        console.error('[FINGERPRINT] Erreur lors de la vérification:', error);
        return res.status(500).json({
            error: 'Erreur lors de la vérification de l\'empreinte'
        });
    }
};

module.exports = {
    generateFingerprintMiddleware,
    verifyFingerprintMiddleware,
    generateFingerprint
}; 