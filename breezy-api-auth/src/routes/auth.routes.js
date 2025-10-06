// Importation du module Express
const express = require('express');

// Création d'une nouvelle instance de Router pour définir les routes
const router = express.Router();

// Importe le contrôleur des tâches depuis le fichier tasks.controller.js
// const tasksController = require('../controllers/tasks.controller.js')
const authController = require('../controllers/auth.controller.js')

// Importe le middleware 'requiredFields' pour valider les champs requis dans la requête
const requiredFields = require('../middlewares/requiredFields.middleware.js')

// Importe le middleware d'authentification pour vérifier les tokens JWT
const authMiddleware = require('../middlewares/auth.middleware.js')

// Importe le middleware de clé API pour sécuriser les routes sensibles
const apiKeyMiddleware = require('../middlewares/apiKey.middleware.js')

// Importe les middlewares d'empreinte pour la sécurité anti-vol de token
const { generateFingerprintMiddleware, verifyFingerprintMiddleware } = require('../middlewares/fingerprint.middleware.js')

// Import JWT pour le debug
const jwt = require('jsonwebtoken');

// Routes publiques avec génération d'empreinte
router.post('/register', generateFingerprintMiddleware, requiredFields(['username', 'password', 'email']), authController.register)
router.post('/login', generateFingerprintMiddleware, requiredFields(['identifier', 'password']), authController.login)

// Routes protégées avec vérification d'empreinte
router.get('/get-payload', authMiddleware, verifyFingerprintMiddleware, authController.getPayload)
router.get('/is-valid-token', authMiddleware, verifyFingerprintMiddleware, authController.isValidToken)

router.post('/generate-2fa-secret', authMiddleware, verifyFingerprintMiddleware, authController.generate2FASecret)
router.post('/verify-2fa-code', authMiddleware, verifyFingerprintMiddleware, authController.verify2FACode)


// Route ultra-sécurisée (API Key + authentification + empreinte)
router.post('/refresh-token', apiKeyMiddleware, generateFingerprintMiddleware, authMiddleware, verifyFingerprintMiddleware, authController.refreshToken)

// ROUTE DEBUG TEMPORAIRE - À SUPPRIMER APRÈS DEBUG (Version GET plus simple)
router.get('/debug-token/:token', (req, res) => {
    try {
        const token = req.params.token;
        
        if (!token) {
            return res.status(400).json({
                error: 'Token requis',
                message: 'Veuillez fournir un token dans l\'URL'
            });
        }
        
        // Décoder le token sans vérification pour voir son contenu
        const decoded = jwt.decode(token);
        
        if (!decoded) {
            return res.status(400).json({
                error: 'Token invalide',
                message: 'Impossible de décoder le token'
            });
        }
        
        // Calculer l'empreinte actuelle avec les headers de la requête
        const crypto = require('crypto');
        const userAgent = req.headers['user-agent'] || '';
        const acceptLanguage = req.headers['accept-language'] || '';
        const acceptEncoding = req.headers['accept-encoding'] || '';
        const clientIP = req.headers['x-forwarded-for'] || 
                        req.headers['x-real-ip'] || 
                        req.connection.remoteAddress || 
                        req.socket.remoteAddress ||
                        (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                        req.ip;
        
        const fingerprintData = `${userAgent}|${acceptLanguage}|${acceptEncoding}|${clientIP}`;
        const currentFingerprint = crypto.createHash('sha256').update(fingerprintData).digest('hex');
        
        res.json({
            message: 'Debug token réussi',
            tokenData: {
                userId: decoded.userId,
                username: decoded.username,
                email: decoded.email,
                fingerprint: decoded.fingerprint,
                iat: decoded.iat,
                exp: decoded.exp
            },
            currentRequest: {
                userAgent,
                acceptLanguage,
                acceptEncoding,
                clientIP,
                fingerprintData,
                currentFingerprint
            },
            comparison: {
                storedFingerprint: decoded.fingerprint,
                currentFingerprint: currentFingerprint,
                match: decoded.fingerprint === currentFingerprint
            }
        });
        
    } catch (error) {
        res.status(500).json({
            error: 'Erreur lors du debug',
            message: error.message
        });
    }
});

// ROUTE DEBUG TEMPORAIRE - Version POST
router.post('/debug-token', (req, res) => {
    try {
        console.log('DEBUG - req.body:', req.body);
        console.log('DEBUG - req.headers:', req.headers);
        
        if (!req.body) {
            return res.status(400).json({
                error: 'Body manquant',
                message: 'Le body de la requête est undefined',
                debug: {
                    bodyExists: !!req.body,
                    contentType: req.headers['content-type'],
                    method: req.method
                }
            });
        }
        
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({
                error: 'Token requis',
                message: 'Veuillez fournir un token dans le body de la requête',
                debug: {
                    receivedBody: req.body,
                    bodyKeys: Object.keys(req.body || {}),
                    contentType: req.headers['content-type']
                }
            });
        }
        
        // Décoder le token sans vérification pour voir son contenu
        const decoded = jwt.decode(token);
        
        if (!decoded) {
            return res.status(400).json({
                error: 'Token invalide',
                message: 'Impossible de décoder le token'
            });
        }
        
        // Calculer l'empreinte actuelle avec les headers de la requête
        const crypto = require('crypto');
        const userAgent = req.headers['user-agent'] || '';
        const acceptLanguage = req.headers['accept-language'] || '';
        const acceptEncoding = req.headers['accept-encoding'] || '';
        const clientIP = req.headers['x-forwarded-for'] || 
                        req.headers['x-real-ip'] || 
                        req.connection.remoteAddress || 
                        req.socket.remoteAddress ||
                        (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                        req.ip;
        
        const fingerprintData = `${userAgent}|${acceptLanguage}|${acceptEncoding}|${clientIP}`;
        const currentFingerprint = crypto.createHash('sha256').update(fingerprintData).digest('hex');
        
        res.json({
            message: 'Debug token réussi',
            tokenData: {
                userId: decoded.userId,
                username: decoded.username,
                email: decoded.email,
                fingerprint: decoded.fingerprint,
                iat: decoded.iat,
                exp: decoded.exp
            },
            currentRequest: {
                userAgent,
                acceptLanguage,
                acceptEncoding,
                clientIP,
                fingerprintData,
                currentFingerprint
            },
            comparison: {
                storedFingerprint: decoded.fingerprint,
                currentFingerprint: currentFingerprint,
                match: decoded.fingerprint === currentFingerprint
            }
        });
        
    } catch (error) {
        res.status(500).json({
            error: 'Erreur lors du debug',
            message: error.message
        });
    }
});

// Exemple d'utilisation du middleware d'authentification sur d'autres routes :
// router.get('/profile', authMiddleware, userController.getProfile)
// router.put('/profile', authMiddleware, requiredFields(['email']), userController.updateProfile)
// router.delete('/account', authMiddleware, userController.deleteAccount)

// Une route pour supprimer une tâche,
// router.delete('/:id', tasksController.deleteTask)

// Une route pour récupérer une tâche spécifique à l'aide de son « _id ».
// router.get('/:id', tasksController.getTaskById)

// // Définition d'une route POST pour la racine du routeur
// router.post('/',(req,res) => {
//     // Afficher des données envoyées dans le corps de la requête 
//     console.log(req.body);

//     // Réponse au client
//     res.status(200).json({
//         message:'Données reçues avec succès'
//     });


// });

// Exportation du router pour pouvoir l'utiliser dans d'autres fichiers
module.exports = router;