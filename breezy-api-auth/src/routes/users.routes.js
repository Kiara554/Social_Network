// Importation du module Express
const express = require('express');

// Création d'une nouvelle instance de Router pour définir les routes
const router = express.Router();

// Importe le contrôleur des tâches depuis le fichier tasks.controller.js
// const tasksController = require('../controllers/tasks.controller.js')
const authController = require('../controllers/users.controller.js')

// Importe le middleware 'requiredFields' pour valider les champs requis dans la requête
const requiredFields = require('../middlewares/requiredFields.middleware.js')

// Importe le middleware d'authentification pour vérifier les tokens JWT
const authMiddleware = require('../middlewares/auth.middleware.js')

// Importe le middleware de clé API pour sécuriser les routes sensibles
const apiKeyMiddleware = require('../middlewares/apiKey.middleware.js')

// Importe les middlewares d'empreinte pour la sécurité anti-vol de token
// const { generateFingerprintMiddleware, verifyFingerprintMiddleware } = require('../middlewares/fingerprint.middleware.js')


// Import JWT pour le debug
const jwt = require('jsonwebtoken');

// Routes publiques avec génération d'empreinte
// router.post('/register', generateFingerprintMiddleware, requiredFields(['username', 'password', 'email']), authController.register)
// router.post('/login', generateFingerprintMiddleware, requiredFields(['identifier', 'password']), authController.login)

// Routes protégées avec vérification d'empreinte
// router.get('/get-payload', authMiddleware, verifyFingerprintMiddleware, authController.getPayload)
// router.get('/is-valid-token', authMiddleware, verifyFingerprintMiddleware, authController.isValidToken)

// router.post('/generate-2fa-secret', authMiddleware, verifyFingerprintMiddleware, authController.generate2FASecret)
// router.post('/verify-2fa-code', authMiddleware, verifyFingerprintMiddleware, authController.verify2FACode)


// Route ultra-sécurisée (API Key + authentification + empreinte)
// router.post('/refresh-token', apiKeyMiddleware, generateFingerprintMiddleware, authMiddleware, verifyFingerprintMiddleware, authController.refreshToken)

router.get('/getAllUsers', apiKeyMiddleware, authController.getAllUsers)
router.patch('/updateIdentifiers/:user_id', requiredFields(['email', 'username']), apiKeyMiddleware, authController.updateIdentifiers)
router.patch('/updateIsBanned/:user_id', requiredFields(['ban']), apiKeyMiddleware, authController.updateIsBanned)

router.get('/:user_id', apiKeyMiddleware, authController.getUserById)




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