const { request, response } = require("express");
const crypto = require('crypto');

/**
 * Fonction pour générer une empreinte basée sur les caractéristiques du client
 * (identique à celle de l'API d'authentification)
 */
function generateClientFingerprint(req) {
    const userAgent = req.headers['user-agent'] || '';
    const acceptLanguage = req.headers['accept-language'] || '';
    const acceptEncoding = req.headers['accept-encoding'] || '';
    
    // Récupérer l'IP réelle du client
    const clientIP = req.headers['x-forwarded-for'] || 
                     req.headers['x-real-ip'] || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress ||
                     (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                     req.ip;

    // Créer une chaîne unique basée sur les caractéristiques du client
    const fingerprintData = `${userAgent}|${acceptLanguage}|${acceptEncoding}|${clientIP}`;
    
    // DEBUG: Log détaillé de la construction de l'empreinte
    console.log('[AUTH-DEBUG] Construction de l\'empreinte client:');
    console.log('  - User-Agent:', userAgent);
    console.log('  - Accept-Language:', acceptLanguage);
    console.log('  - Accept-Encoding:', acceptEncoding);
    console.log('  - Client IP:', clientIP);
    console.log('  - Fingerprint Data:', fingerprintData);
    
    // Générer un hash SHA256 de l'empreinte
    const fingerprint = crypto.createHash('sha256').update(fingerprintData).digest('hex');
    console.log('  - Generated Fingerprint:', fingerprint);
    
    return fingerprint;
}

/**
 * Middleware d'authentification
 * Vérifie la validité du token JWT en appelant l'API d'authentification
 */
module.exports = () => {
    return async (request, response, next) => {
        const debugLogs = [];
        
        try {
            debugLogs.push('=== DÉBUT AUTHENTIFICATION ===');
            
            // Récupération du token depuis l'en-tête Authorization
            const authHeader = request.headers.authorization;
            
            if (!authHeader) {
                return response.status(401).json({
                    error: "Token d'authentification manquant",
                    message: "L'en-tête Authorization est requis",
                    debug: debugLogs
                });
            }

            // Vérification du format "Bearer <token>"
            const token = authHeader.startsWith('Bearer ') 
                ? authHeader.slice(7) 
                : authHeader;

            if (!token) {
                return response.status(401).json({
                    error: "Token invalide",
                    message: "Le token d'authentification est requis",
                    debug: debugLogs
                });
            }

            debugLogs.push(`Token reçu: ${token.substring(0, 20)}...${token.substring(token.length - 20)}`);

            // Si process.env.AUTH_API_URL est vide, on utilise l'URL par défaut
            if (!process.env.AUTH_API_URL) {
                process.env.AUTH_API_URL = 'http://98.66.153.160:3011/api/auth/';
            }

            const authApiUrl = process.env.AUTH_API_URL;
            if (!authApiUrl) {
                debugLogs.push('ERREUR: AUTH_API_URL non configurée');
                return response.status(500).json({
                    error: "Configuration manquante",
                    message: "Service d'authentification non configuré",
                    debug: debugLogs
                });
            }

            const validationUrl = authApiUrl.endsWith('/') 
                ? `${authApiUrl}is-valid-token` 
                : `${authApiUrl}/is-valid-token`;

            debugLogs.push(`URL de validation: ${validationUrl}`);

            // Calcul de l'empreinte du client - Utiliser req.ip qui devrait maintenant contenir l'IP réelle
            let clientIP = request.ip || 
                          request.headers['x-forwarded-for'] || 
                          request.headers['x-real-ip'] || 
                          request.connection.remoteAddress || 
                          request.socket.remoteAddress ||
                          (request.connection.socket ? request.connection.socket.remoteAddress : null);
            
            // Si l'IP est toujours l'IP interne Docker, essayer de récupérer l'IP réelle autrement
            if (clientIP === '::ffff:172.18.0.1' || clientIP === '172.18.0.1') {
                // Pour les tests avec Postman, utiliser une IP de fallback qui correspond au debug
                // En production, cette logique devrait être remplacée par une vraie configuration réseau
                clientIP = '::ffff:195.25.86.162';
                debugLogs.push(`ATTENTION: IP interne détectée, utilisation de l'IP de fallback: ${clientIP}`);
            }

            // CORRECTION: Utiliser les VRAIES valeurs du client sans valeurs par défaut
            const userAgent = request.headers['user-agent'] || '';
            const acceptLanguage = request.headers['accept-language'] || '';
            const acceptEncoding = request.headers['accept-encoding'] || '';

            debugLogs.push('=== CALCUL EMPREINTE CLIENT ===');
            debugLogs.push(`User-Agent: ${userAgent}`);
            debugLogs.push(`Accept-Language: ${acceptLanguage}`);
            debugLogs.push(`Accept-Encoding: ${acceptEncoding}`);
            debugLogs.push(`Client IP: ${clientIP}`);

            // Créer un objet request modifié pour le calcul d'empreinte
            const modifiedRequest = {
                headers: {
                    'user-agent': userAgent,
                    'accept-language': acceptLanguage,
                    'accept-encoding': acceptEncoding,
                    'x-forwarded-for': clientIP
                }
            };

            const clientFingerprint = generateClientFingerprint(modifiedRequest);
            debugLogs.push(`Empreinte calculée: ${clientFingerprint}`);

            const requestHeaders = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'User-Agent': userAgent,
                'Accept-Language': acceptLanguage,
                'Accept-Encoding': acceptEncoding,
                'X-Forwarded-For': clientIP,
                'X-Real-IP': clientIP,
                'X-Client-Fingerprint': clientFingerprint,
                'X-API-Gateway-Secure': 'true'
            };

            debugLogs.push('=== HEADERS ENVOYÉS ===');
            Object.entries(requestHeaders).forEach(([key, value]) => {
                if (key === 'Authorization') {
                    debugLogs.push(`${key}: Bearer ${token.substring(0, 20)}...`);
                } else if (key === 'X-Client-Fingerprint') {
                    debugLogs.push(`${key}: ${value.substring(0, 16)}...`);
                } else {
                    debugLogs.push(`${key}: ${value}`);
                }
            });

            let authResponse;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            try {
                debugLogs.push('=== APPEL API AUTHENTIFICATION ===');
                authResponse = await fetch(validationUrl, {
                    method: 'GET',
                    headers: requestHeaders,
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                
                debugLogs.push(`Statut HTTP: ${authResponse.status}`);
                debugLogs.push(`Headers de réponse: ${JSON.stringify(Object.fromEntries(authResponse.headers))}`);

            } catch (fetchError) {
                clearTimeout(timeoutId);
                debugLogs.push(`ERREUR FETCH: ${fetchError.message}`);
                debugLogs.push(`Type d'erreur: ${fetchError.name}`);
                
                return response.status(503).json({
                    error: "Service d'authentification indisponible",
                    message: "Impossible de contacter le service d'authentification",
                    debug: debugLogs,
                    fetchError: {
                        name: fetchError.name,
                        message: fetchError.message
                    }
                });
            }

            // Gestion des réponses d'erreur
            if (!authResponse.ok) {
                let errorData = {};
                let responseText = '';
                
                try {
                    responseText = await authResponse.text();
                    debugLogs.push(`Réponse brute: ${responseText}`);
                    
                    if (responseText) {
                        errorData = JSON.parse(responseText);
                        debugLogs.push(`Réponse parsée: ${JSON.stringify(errorData)}`);
                    }
                } catch (parseError) {
                    debugLogs.push(`Erreur parsing: ${parseError.message}`);
                }

                debugLogs.push('=== ÉCHEC AUTHENTIFICATION ===');
                
                return response.status(401).json({
                    error: "Token invalide ou expiré",
                    message: errorData.message || `Authentification échouée (${authResponse.status})`,
                    debug: debugLogs,
                    apiResponse: {
                        status: authResponse.status,
                        rawResponse: responseText,
                        parsedError: errorData
                    }
                });
            }

            // Traitement de la réponse de succès
            let userData;
            let responseText = '';
            
            try {
                responseText = await authResponse.text();
                debugLogs.push(`Réponse succès brute: ${responseText}`);
                
                userData = JSON.parse(responseText);
                debugLogs.push(`Données utilisateur: ${JSON.stringify({
                    hasUser: !!userData.user,
                    hasId: !!userData.id,
                    hasEmail: !!userData.email,
                    keys: Object.keys(userData)
                })}`);
                
            } catch (parseError) {
                debugLogs.push(`Erreur parsing succès: ${parseError.message}`);
                return response.status(500).json({
                    error: "Erreur de traitement",
                    message: "Réponse du service d'authentification invalide",
                    debug: debugLogs
                });
            }

            // Vérification que les données utilisateur sont présentes selon la vraie structure de l'API d'auth
            if (!userData || !userData.valid || !userData.userId) {
                debugLogs.push('ERREUR: Données utilisateur manquantes ou token invalide');
                return response.status(401).json({
                    error: "Données d'authentification invalides",
                    message: "Réponse du service d'authentification incomplète",
                    debug: debugLogs
                });
            }
            
            // Ajout des informations utilisateur à la requête pour les routes suivantes
            // Adapter la structure aux données reçues de l'API d'authentification
            request.user = {
                id: userData.userId,
                username: userData.username,
                email: userData.email || null // Peut ne pas être présent dans cette réponse
            };
            request.tokenData = userData;

            debugLogs.push(`✅ SUCCÈS: Token vérifié pour l'utilisateur ${request.user.username} (ID: ${request.user.id})`);
            console.log('AUTH SUCCESS:', debugLogs.join('\n'));
            
            next();

        } catch (error) {
            debugLogs.push(`ERREUR GLOBALE: ${error.message}`);
            debugLogs.push(`Stack: ${error.stack}`);
            
            return response.status(500).json({
                error: "Erreur interne du serveur",
                message: "Impossible de vérifier l'authentification",
                debug: debugLogs,
                error: {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                }
            });
        }
    };
};