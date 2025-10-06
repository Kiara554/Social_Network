// Importation du module Express
const express = require('express');


// Création d'une nouvelle instance de Router pour définir les routes
const router = express.Router();

// Importe le middleware 'requiredFields' pour valider les champs requis dans la requête
const requireFields = require('../middlewares/requiredFields.middleware');

// Importe le middleware d'authentification
const authMiddleware = require('../middlewares/authentication.middleware');

// Variable de bypass pour l'authentification (utile pour les tests et le développement)
const BYPASS_AUTH = process.env.BYPASS_AUTH === 'true' || true;

// Log du statut du bypass
if (BYPASS_AUTH) {
    console.warn('⚠️  ATTENTION: Le bypass d\'authentification est ACTIVÉ. Toutes les routes sont accessibles sans token!');
} else {
    console.log('🔒 Authentification activée pour les routes protégées');
}

/*---------------------------------------
ROUTES PUBLIQUES
---------------------------------------*/

/*const userController = require('../controllers/user.controller.js');

// Route publique pour la racine (accessible sans authentification)
router.get('/', userController.getAllUser);

// Route publique pour créer un utilisateur (inscription)
router.post('/adduser', userController.createUser);*/

/*---------------------------------------
ROUTES PROTÉGÉES - Explorer
---------------------------------------*/


const explorerController = require('../controllers/explorer.controller');

router.get('/explorer', explorerController.handleExplorer);
router.get('/explorer/recent', explorerController.getRecentPosts);


/*---------------------------------------
MIDDLEWARE D'AUTHENTIFICATION
Toutes les routes suivantes nécessitent une authentification
(sauf si BYPASS_AUTH=true)
---------------------------------------*/

// Application conditionnelle du middleware d'authentification
if (!BYPASS_AUTH) {
    router.use(authMiddleware());
}

/*---------------------------------------
ROUTES PROTÉGÉES - Breez
---------------------------------------*/

const breezController = require('../controllers/breez.controller.js')

router.post('/addbreez',
    requireFields(["authorId", "authorUserName", "textContent"]),
    breezController.createBreez);

router.patch('/updatebreez/:id',
    breezController.updateBreez);

router.get('/getallbreez',
    breezController.getAllBreez);

router.get('/getBreez/:id',
    breezController.getBreez);

router.get('/getalluserbreez/:authorId',
    breezController.getAllUserBreez);

router.delete('/deletebreez/:id',
    breezController.deleteBreez);


/*---------------------------------------
ROUTES PROTÉGÉES - Comment
---------------------------------------*/

const commentController = require('../controllers/comment.controller.js');

router.post('/addcomment',
    requireFields(["authorId", "breezId", "textContent"]),
    commentController.createCommentBreez);

router.get('/getcomment/:commentId',
    commentController.getComment);

router.get('/getallusercomment/:authorId',
    commentController.getAllUserComment);

router.get('/getnbcommentbreez/:breezId',
    commentController.getNbCommentBreez);


// Delete all comments related to a post
router.delete('/deletebreezcomment/:breezId', 
    commentController.deleteCommentsByPost);
    
/*---------------------------------------
ROUTES PROTÉGÉES - Like
---------------------------------------*/

const likeController = require('../controllers/like.controller.js');

router.post('/addlike',
    requireFields(["authorId"]),
    likeController.createLike);

router.get('/alreadylike/:userid/:breezId',
    likeController.alreadylike);

router.delete('/deletelike/:authorId/:breezId',
    likeController.deleteLike);

router.get('/getnblikebreez/:breezId',
    likeController.getNbLikeBreez);

router.get('/getalluserlike/:authorId',
    likeController.getAllUserLikes);


// Delete all likes related to a post
router.delete('/deletebreezlike/:breezId', 
    likeController.deleteLikesByPost);

    
/*---------------------------------------
ROUTES PROTÉGÉES - Reply Comment
---------------------------------------*/

const replycommentcontroller = require('../controllers/Replycomment.controller.js');

router.post('/replycomment',
    requireFields(["authorId", "commentId", "textContent"]),
    replycommentcontroller.ReplyCommentBreez);

/*---------------------------------------
ROUTES PROTÉGÉES - Follow
---------------------------------------*/

const followController = require('../controllers/follow.controller.js');

router.post('/follow', 
    requireFields(["authorId", "authorIdFollowed"]), 
    followController.followUser);

router.delete('/unfollow/:authorId/:authorIdFollowed',
    followController.unfollowUser);

router.get('/followers/:id', followController.getFollowers);

router.get('/following/:id', followController.getFollowing);

router.get('/issubscribed/:authorId/:authorIdFollowed', followController.isSubscribed);

/*---------------------------------------
ROUTES PROTÉGÉES - Conversations
---------------------------------------*/

const conversationController = require('../controllers/conversation.controller.js');

// Crée une nouvelle conversation (ou récupère une existante)
router.post(
    '/conversations',
    requireFields(["participants"]),
    conversationController.createConversation
);

// Récupère toutes les conversations d'un utilisateur
router.get(
    '/conversations/user/:userId',
    conversationController.getUserConversations
);

// Récupère une conversation spécifique entre deux utilisateurs
router.get(
    '/conversations/find/:user1Id/:user2Id',
    conversationController.getConversationBetweenUsers
);

router.get(
    '/conversations/:conversationId',
    conversationController.getConversationById
);



/*---------------------------------------
ROUTES PROTÉGÉES - Message
---------------------------------------*/

const messageController = require('../controllers/message.controller.js');

// Envoie un message dans une conversation
router.post(
    '/messages',
    requireFields(["conversationId", "sender", "content"]),
    messageController.sendMessage
);

// Récupère tous les messages d'une conversation
router.get(
    '/messages/:conversationId',
    messageController.getMessagesForConversation
);

/*---------------------------------------
ROUTES PROTÉGÉES - Notify
---------------------------------------*/

const notifyController = require('../controllers/notify.controller'); // Adjust path as necessary

// Route to create a new notification
router.post('/notify', notifyController.createNotification);

// Route to get all notifications
router.get('/notify', notifyController.getAllNotifications);

// Route to get a single notification by its ID
router.get('/notify/:id', notifyController.getNotificationById);

// Route to get all notifications for a specific user
router.get('/notify/user/:userId', notifyController.getUserNotifications);

// Route to update a notification (e.g., mark as read)
router.put('/notify/:id', notifyController.updateNotification);

// Route to delete a notification
router.delete('/notify/:id', notifyController.deleteNotification);

// Route to mark all notifications for a user as read
router.put('/notify/mark-read/:userId', notifyController.markAllUserNotificationsAsRead);



const profileController = require('../controllers/profile.controller.js');

// Créer un profil
router.post('/profile',
    profileController.createProfile
);

// Obtenir tous les profils
router.get('/profiles',
    profileController.getAllProfiles
);

// Obtenir un profil par ID
router.get('/profile/:id',
    profileController.getProfileById
);

// Mettre à jour un profil
router.put('/profile/:id',
    profileController.updateProfile
);

// Mettre à jour le user
router.patch('/profile/user/:id',
    profileController.updateUser
)

// Mettre à jour le user
router.patch('/profile/user/banned/:id',
    profileController.isBannedUpdate
)

// Supprimer un profil
router.delete('/profile/:id',
    profileController.deleteProfile
);
/*---------------------------------------
ReportUser
---------------------------------------*/

const reportController = require('../controllers/ReportUser.controller');

router.post('/reportuser', reportController.createReport);
router.get('/reportuser', reportController.getAllReports);
router.patch('/reportuser/:id', reportController.updateReportStatus);
router.delete('/reportuser/:id', reportController.deleteReport);

/*---------------------------------------
ReportBreez
---------------------------------------*/
const reportBreezController = require('../controllers/reportbreez.controller');

router.post('/reportbreez', reportBreezController.createReport);
router.get('/reportbreez', reportBreezController.getAllReports);
router.patch('/reportbreez/:id', reportBreezController.updateStatus);
router.delete('/reportbreez/:id', reportBreezController.deleteReport);


/*---------------------------------------
ROUTES PROTÉGÉES - Profil
---------------------------------------*/

const parametresProfilController = require('../controllers/parametresprofil.controller');

router.get('/profilestats/:id', parametresProfilController.getProfileFromSQL);
router.patch('/profilestats/:id', parametresProfilController.updateProfileInSQL);

const adminController = require('../controllers/admin.controller');
const adminMiddleware = require('../middlewares/admin.middleware');

// // Middleware pour vérifier si l'utilisateur est admin
// router.use(adminMiddleware);
//
// router.get('/users', adminController.getAllUsers);
// router.get('/users/:id', adminController.getUserDetails);
// router.post('/users/:id/ban', adminController.banUser);
// router.post('/users/:id/unban', adminController.unbanUser);
// router.get('/stats', adminController.getStats);



module.exports = router;



