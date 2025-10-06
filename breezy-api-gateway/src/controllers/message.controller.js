const Message = require('../models/message.model');
const Conversation = require('../models/conversation.model');

module.exports = {
    /**
     * Envoie un message dans une conversation.
     */
    sendMessage: async (req, res) => {
        try {
            const { conversationId, sender, content } = req.body;

            // Vérifier que la conversation existe
            const conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                return res.status(404).json({ error: "Conversation introuvable." });
            }

            // Créer le nouveau message
            const newMessage = new Message({
                conversationId,
                sender,
                content
            });

            await newMessage.save();

            // Ajouter la référence du message à la conversation et mettre à jour la date du dernier message
            conversation.messages.push(newMessage._id);
            conversation.lastMessageAt = Date.now();
            await conversation.save();

            // Idéalement, ici, vous émettriez également un événement via WebSockets
            // pour notifier les clients en temps réel.
            // ex: io.to(conversationId).emit('newMessage', newMessage);

            res.status(201).json({ message: "Message envoyé avec succès", newMessage });

        } catch (err) {
            res.status(500).json({ error: "Erreur serveur lors de l'envoi du message.", details: err });
        }
    },

    /**
     * Récupère tous les messages d'une conversation spécifique.
     */
    getMessagesForConversation: async (req, res) => {
        try {
            const { conversationId } = req.params;

            const messages = await Message.find({ conversationId })
                .sort({ createdAt: 'asc' }); // Trier par date de création pour un affichage chronologique

            if (!messages) {
                return res.status(404).json({ message: "Aucun message trouvé pour cette conversation." });
            }

            res.status(200).json(messages);

        } catch (err) {
            res.status(500).json({ error: "Erreur serveur lors de la récupération des messages.", details: err });
        }
    }
};