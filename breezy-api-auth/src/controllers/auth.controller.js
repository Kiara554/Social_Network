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

// Fonction pour envoyer un email de bienvenue via l'API Mailjet
const sendWelcomeEmail = async (email, username) => {
    try {
        const mailjetApiKey = process.env.MAILJET_API_KEY;
        const mailjetSecretKey = process.env.MAILJET_SECRET_KEY;

        if (!mailjetApiKey || !mailjetSecretKey) {
            console.error('MAILJET_API_KEY or MAILJET_SECRET_KEY not configured');
            return false;
        }

        const emailData = {
            Messages: [{
                From: {
                    Email: process.env.SENDER_EMAIL || "noreply@breezy-app.com",
                    Name: process.env.SENDER_NAME || "Breezy App"
                },
                To: [{
                    Email: email,
                    Name: username
                }],
                Subject: "Bienvenue sur Breezy App !",
                HTMLPart: `
                    <html>
                    <head></head>
                    <body>
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <h1 style="color: #333; text-align: center;">Bienvenue sur Breezy App !</h1>
                            <p style="color: #666; font-size: 16px;">Bonjour <strong>${username}</strong>,</p>
                            <p style="color: #666; font-size: 16px;">
                                Nous sommes ravis de vous accueillir dans notre communauté ! Votre compte a été créé avec succès.
                            </p>
                            <p style="color: #666; font-size: 16px;">
                                Vous pouvez maintenant vous connecter et profiter de toutes les fonctionnalités de notre application.
                            </p>
                            
                            <p style="color: #666; font-size: 14px; text-align: center;">
                                Si vous avez des questions, n'hésitez pas à nous contacter.
                            </p>
                            <p style="color: #666; font-size: 14px; text-align: center;">
                                L'équipe Breezy App
                            </p>
                        </div>
                    </body>
                    </html>
                `
            }]
        };
        // TODO: Add a link to the application quand on sera en https car risque de bannissement
        // <div style="text-align: center; margin: 30px 0;">
        //     <a href="${process.env.FRONTEND_URL || 'http://breezy.student-project.space'}" 
        //         style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
        //         Accéder à l'application
        //     </a>
        // </div>

        // Encodage en Base64 pour l'authentification Basic
        const credentials = Buffer.from(`${mailjetApiKey}:${mailjetSecretKey}`).toString('base64');

        const response = await fetch('https://api.mailjet.com/v3.1/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`
            },
            body: JSON.stringify(emailData)
        });

        if (response.ok) {
            const result = await response.json();
            console.log(`Welcome email sent successfully to ${email}`, result);
            return true;
        } else {
            const errorData = await response.json();
            console.error('Failed to send welcome email:', errorData);
            return false;
        }
    } catch (error) {
        console.error('Error sending welcome email:', error);
        return false;
    }
};

module.exports = {
    // Fonction asynchrone pour créer un nouvel utilisateur (register).
    register: async (req, res) => {
        // Extraction des données de la requête : username, password et email.

        console.log("register", req.body);

        const { username, password, email } = req.body;

        try {
            // Vérifier si l'utilisateur existe déjà - Vérification séparée pour email et username
            const checkEmailQuery = 'SELECT * FROM users WHERE login = ?';
            const checkUsernameQuery = 'SELECT * FROM users WHERE username = ?';

            // Vérification de l'email avec retry
            const emailResults = await executeQueryWithRetry(checkEmailQuery, [email]);
            console.log("emailResults", emailResults);

            if (emailResults.length > 0) {
                return res.status(400).json({ error: 'Email already registered' });
            }

            // Si l'email est disponible, vérifier le username avec retry
            const usernameResults = await executeQueryWithRetry(checkUsernameQuery, [username]);
            console.log("usernameResults", usernameResults);

            if (usernameResults.length > 0) {
                return res.status(400).json({ error: 'Username already taken' });
            }

            // Si ni l'email ni le username ne sont pris, procéder à l'inscription
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            const insertUserQuery = 'INSERT INTO users (username, login, password) VALUES (?, ?, ?)';
            const results = await executeQueryWithRetry(insertUserQuery, [username, email, hashedPassword]);

            // Envoyer l'email de bienvenue
            // const emailSent = await sendWelcomeEmail(email, username);

            const token = jwt.sign(
                {
                    userId: results.insertId,
                    username: username,
                    email: email,
                    fingerprint: req.deviceFingerprint
                },
                process.env.JWT_SECRET || 'default_secret',
                { expiresIn: '24h' }
            );

            res.status(201).json({
                message: 'User registered successfully',
                token: token,
                user: {
                    id: results.insertId,
                    username: username,
                    email: email
                },
                // emailSent: emailSent
            });

        } catch (err) {
            console.error('Register error:', err);

            // Gérer spécifiquement les erreurs de contrainte d'unicité
            if (err.code === 'ER_DUP_ENTRY') {
                if (err.message.includes('unique_login')) {
                    return res.status(400).json({ error: 'Email already registered' });
                } else if (err.message.includes('unique_username')) {
                    return res.status(400).json({ error: 'Username already taken' });
                }
                return res.status(400).json({ error: 'User already exists' });
            }

            // Erreurs de base de données
            if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNREFUSED') {
                return res.status(503).json({ error: 'Database connection failed. Please try again.' });
            }

            res.status(500).json({ error: 'Server error', details: err.message });
        }
    },

    // Fonction asynchrone pour connecter un utilisateur (login).
    login: async (req, res) => {
        const { identifier, password } = req.body;

        console.log("login", req.body);

        try {
            // Rechercher l'utilisateur dans la base de données par nom d'utilisateur ou email
            const getUserQuery = 'SELECT * FROM users WHERE username = ? OR login = ?';
            const results = await executeQueryWithRetry(getUserQuery, [identifier, identifier]);

            console.log("Login query executed successfully");

            if (results.length === 0) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            console.log("User found:", results[0].username);

            const user = results[0];

            // Vérifier le mot de passe
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Add the check for is_banned
            if (user.is_banned === 1) {
                return res.status(403).json({ error: `Account banned` });
            }

            // Mettre à jour la date de dernière connexion (sans attendre le résultat)
            const updateLastLoginQuery = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?';
            try {
                await executeQueryWithRetry(updateLastLoginQuery, [user.user_id]);
            } catch (updateErr) {
                console.error('Failed to update last login:', updateErr);
                // Ne pas bloquer le login pour cette erreur
            }

            // Vérifier si l'utilisateur a activé le 2FA
            if (user.two_factor_secret && user.two_factor_secret.trim() !== '') {
                // Générer un token JWT avec empreinte
                const token = jwt.sign(
                    {
                        userId: user.user_id,
                        username: user.username,
                        email: user.login,
                        fingerprint: req.deviceFingerprint, // Ajout de l'empreinte
                        two_factor_auth: true,
                        auth_complete: false
                    },
                    process.env.JWT_SECRET || 'default_secret',
                    { expiresIn: '24h' }
                );

                res.status(206).json({
                    message: '2FA required',
                    token: token,
                    user: {
                        id: user.user_id,
                        username: user.username,
                        email: user.login
                    }
                });
            } else {
                // Générer un token JWT avec empreinte
                const token = jwt.sign(
                    {
                        userId: user.user_id,
                        username: user.username,
                        email: user.login,
                        fingerprint: req.deviceFingerprint, // Ajout de l'empreinte
                        two_factor_auth: false,
                        auth_complete: true
                    },
                    process.env.JWT_SECRET || 'default_secret',
                    { expiresIn: '24h' }
                );

                res.status(200).json({
                    message: 'Login successful',
                    token: token,
                    user: {
                        id: user.user_id,
                        username: user.username,
                        email: user.login
                    }
                });
            }



        } catch (err) {
            console.error('Login error:', err);

            // Erreurs de base de données
            if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNREFUSED') {
                return res.status(503).json({ error: 'Database connection failed. Please try again.' });
            }

            // En cas d'erreur, envoi d'une réponse avec un statut 500 (Internal Server Error)
            res.status(500).json({ error: 'Server error', details: err.message });
        }
    },
    getPayload: (req, res) => {
        // Les informations utilisateur sont déjà disponibles grâce au middleware d'authentification
        res.status(200).json({
            message: 'Payload récupéré avec succès',
            user: req.user
        });
    },

    // Méthode pour vérifier si un token est valide
    isValidToken: (req, res) => {
        // Si on arrive ici, c'est que le token est valide (grâce au middleware d'authentification)
        res.status(200).json({
            message: 'Token valide',
            valid: true,
            userId: req.user.userId,
            username: req.user.username
        });
    },

    // Méthode pour regénérer/renouveler un token
    refreshToken: async (req, res) => {
        try {
            // Les informations utilisateur sont déjà disponibles grâce au middleware d'authentification
            const { userId, username } = req.user;

            // Récupérer les informations complètes de l'utilisateur depuis la base de données
            const getUserQuery = 'SELECT * FROM users WHERE user_id = ?';
            const results = await executeQueryWithRetry(getUserQuery, [userId]);

            if (results.length === 0) {
                return res.status(404).json({ error: 'Utilisateur non trouvé' });
            }

            const user = results[0];

            // Générer un nouveau token JWT avec nouvelle empreinte
            const newToken = jwt.sign(
                {
                    userId: user.user_id,
                    username: user.username,
                    email: user.login,
                    fingerprint: req.deviceFingerprint // Nouvelle empreinte
                },
                process.env.JWT_SECRET || 'default_secret',
                { expiresIn: '24h' }
            );

            res.status(200).json({
                message: 'Token regénéré avec succès',
                token: newToken,
                user: {
                    id: user.user_id,
                    username: user.username,
                    email: user.login
                }
            });
        } catch (err) {
            res.status(500).json({ error: 'Erreur serveur', details: err });
        }
    },

    generate2FASecret: async (req, res) => {
        try {
            const { userId } = req.user;

            // Vérifier que l'utilisateur existe
            const getUserQuery = 'SELECT * FROM users WHERE user_id = ?';
            const results = await executeQueryWithRetry(getUserQuery, [userId]);

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Utilisateur non trouvé'
                });
            }

            const user = results[0];
            let secretToUse;
            let message;

            // Cas 1: two_factor_secret existe en base (déjà activé)
            if (user.two_factor_secret && user.two_factor_secret.trim() !== '') {
                secretToUse = user.two_factor_secret;
                message = 'Secret 2FA déjà activé';
            }
            // Cas 2: Aucun secret n'existe, on en génère un nouveau
            else {
                const secret = speakeasy.generateSecret({
                    name: 'Breezy App',
                    issuer: 'Breezy App'
                });
                secretToUse = secret.base32;

                message = 'Secret 2FA généré avec succès. Veuillez valider le code pour l\'activer.';
            }

            // Générer le QR code avec le secret approprié
            const qrCode = speakeasy.otpauthURL({
                secret: secretToUse,
                label: 'Breezy App',
                encoding: 'base32'
            });

            // Retourner le secret et le QR code
            res.status(200).json({
                success: true,
                message: message,
                secretKey: secretToUse,
                qrCode: qrCode
            });

        } catch (error) {
            console.error('Erreur lors de la génération du secret 2FA:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur serveur lors de la génération du secret 2FA',
                details: error.message
            });
        }
    },

    verify2FACode: async (req, res) => {
        try {
            const { userId, two_factor_auth, auth_complete } = req.user;
            const { code, secretKey } = req.body;

            // DEBUG: Afficher les valeurs exactes
            console.log("DEBUG - req.user:", JSON.stringify(req.user, null, 2));
            console.log("DEBUG - two_factor_auth:", two_factor_auth, "Type:", typeof two_factor_auth);
            console.log("DEBUG - auth_complete:", auth_complete, "Type:", typeof auth_complete);

            if (!code) {
                return res.status(400).json({
                    success: false,
                    error: 'Code 2FA requis'
                });
            }

            // Récupérer les informations de l'utilisateur
            const getUserQuery = 'SELECT * FROM users WHERE user_id = ?';
            const results = await executeQueryWithRetry(getUserQuery, [userId]);

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Utilisateur non trouvé'
                });
            }

            const user = results[0];
            let secretToVerify;

            // Vérifier si un secret 2FA existe déjà en base (validation d'un secret existant)
            if (user.two_factor_secret) {
                // Utiliser le secret stocké en base pour validation
                secretToVerify = user.two_factor_secret;
            } else {
                // Pour l'activation d'un nouveau secret, utiliser le secret fourni dans la requête
                if (!secretKey) {
                    return res.status(400).json({
                        success: false,
                        error: 'Secret 2FA requis pour l\'activation'
                    });
                }
                secretToVerify = secretKey;
            }

            // Vérifier le code 2FA
            const isValid = speakeasy.totp.verify({
                secret: secretToVerify,
                encoding: 'base32',
                token: code,
                window: 2 // Tolérance de 2 périodes (60 secondes)
            });

            if (!isValid) {
                return res.status(400).json({
                    success: false,
                    error: 'Code 2FA invalide'
                });
            }

            // Si le code est valide et qu'on activait un nouveau secret, le sauvegarder en base
            if (!user.two_factor_secret && secretKey) {
                const updateUserQuery = 'UPDATE users SET two_factor_secret = ? WHERE user_id = ?';
                await executeQueryWithRetry(updateUserQuery, [secretKey, userId]);

                res.status(200).json({
                    success: true,
                    message: 'Code 2FA vérifié et activé avec succès'
                });
            } else if (two_factor_auth === true && auth_complete === false) {
                // Cas du login avec 2FA : générer le token final après validation
                console.log("DEBUG - Entrant dans la condition login 2FA");
                const finalToken = jwt.sign(
                    {
                        userId: user.user_id,
                        username: user.username,
                        email: user.login,
                        fingerprint: req.user.fingerprint,
                        two_factor_auth: true,
                        auth_complete: true
                    },
                    process.env.JWT_SECRET || 'default_secret',
                    { expiresIn: '24h' }
                );

                res.status(200).json({
                    success: true,
                    message: 'Code 2FA vérifié avec succès - Connexion complétée',
                    token: finalToken,
                    user: {
                        id: user.user_id,
                        username: user.username,
                        email: user.login
                    }
                });
            } else {
                // Validation d'un secret déjà activé (cas normal)
                console.log("DEBUG - Entrant dans le cas else (validation normale)");
                res.status(200).json({
                    success: true,
                    message: 'Code 2FA vérifié avec succès'
                });
            }

        } catch (error) {
            console.error('Erreur lors de la vérification du code 2FA:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur serveur lors de la vérification du code 2FA'
            });
        }
    }

};