const Conversation = require('../models/conversation.model');
const Message = require('../models/message.model');

module.exports = {
    /**
     * Crée une nouvelle conversation ou récupère une conversation existante
     * entre les mêmes participants.
     */
    createConversation: async (req, res) => {
        try {
            const { participants } = req.body; // ex: ["userId1", "userId2"]

            if (!participants || participants.length < 2) {
                return res.status(400).json({ error: "Une conversation doit avoir au moins deux participants." });
            }

            // Chercher si une conversation avec ces participants existe déjà
            const existingConversation = await Conversation.findOne({
                participants: { $all: participants, $size: participants.length }
            });

            if (existingConversation) {
                return res.status(200).json(existingConversation);
            }

            // Sinon, créer une nouvelle conversation
            const newConversation = new Conversation({
                participants: participants
            });

            await newConversation.save();
            res.status(201).json({ message: "Conversation créée avec succès", conversation: newConversation });

        } catch (err) {
            res.status(500).json({ error: "Erreur serveur lors de la création de la conversation.", details: err });
        }
    },

    /**
     * Récupère toutes les conversations d'un utilisateur spécifique.
     */
    getUserConversations: async (req, res) => {
        try {
            const { userId } = req.params;
            const conversations = await Conversation.find({ participants: userId })
                .populate({
                    path: 'messages',
                    options: { sort: { 'createdAt': -1 }, limit: 1 } // Récupère seulement le dernier message
                })
                .sort({ lastMessageAt: -1 }); // Trie les conversations par le message le plus récent

            if (!conversations) {
                return res.status(404).json({ message: "Aucune conversation trouvée pour cet utilisateur." });
            }

            res.status(200).json(conversations);

        } catch (err) {
            res.status(500).json({ error: "Erreur serveur lors de la récupération des conversations.", details: err });
        }
    },

    /**
     * Trouve et renvoie une conversation existante entre deux utilisateurs.
     */
    getConversationBetweenUsers: async (req, res) => {
        try {
            const { user1Id, user2Id } = req.params;

            const conversation = await Conversation.findOne({
                participants: { $all: [user1Id, user2Id], $size: 2 }
            });

            if (!conversation) {
                return res.status(404).json({ message: "Aucune conversation trouvée entre ces deux utilisateurs." });
            }

            res.status(200).json(conversation);

        } catch (err) {
            res.status(500).json({ error: "Erreur serveur lors de la recherche de la conversation.", details: err });
        }
    },

    /**
     * Récupère une conversation spécifique par son ID.
     */
    getConversationById: async (req, res) => {
        try {
            const { conversationId } = req.params;

            console.log(conversationId);

            const conversation = await Conversation.findById(conversationId);

            if (!conversation) {
                return res.status(404).json({ message: "Conversation non trouvée." });
            }

            res.status(200).json(conversation);

        } catch (err) {
            res.status(500).json({ error: "Erreur serveur lors de la récupération de la conversation.", details: err });
        }
    },


};