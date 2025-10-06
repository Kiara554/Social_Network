const Comment = require("../models/commentschema.model");
const Breez = require("../models/breez.model");
 
module.exports = {

    createCommentBreez: async (req, res) => {
    
        const { authorId, authorUserName, breezId, textContent, mediaUrl, mediaType, idCommentResponse } = req.body;

        try {

            const newComment = new Comment({
                authorId,
                authorUserName,
                breezId,
                textContent,
                mediaUrl,
                mediaType,
                idCommentResponse: idCommentResponse || null,
            });

            await newComment.save();

            const breez = await Breez.findById(breezId);

            // Check if the breez exists
            if (!breez) {
                // If breez not found, you might want to delete the newly created comment
                // to avoid orphaned documents.
                await Comment.findByIdAndDelete(newComment._id);
                return res.status(404).json({ error: "Breez introuvable." });
            }

            // Seulement ajouter les commentaires de premier niveau à la liste du breez
            // Les réponses ne sont pas ajoutées car elles sont récupérées via les commentaires parents
            if (!idCommentResponse) {
                breez.comments.push(newComment._id);
                await breez.save();
            }

            res.status(201).json({ message: "Commentaire ajouté", newComment });

        } catch (err) {
            res.status(500).json({ error: "Erreur serveur", details: err });
        }

    },

    getComment: async (req, res) => {

        const { commentId } = req.params;
        console.log(commentId);

        try {

            const comment = await Comment.findById(commentId);
            
            if (!comment) {
                return res.status(404).json({ error: "Commentaire introuvable" });
            }

            // Fonction récursive pour récupérer les commentaires imbriqués
            const getNestedComments = async (commentId) => {
                const comment = await Comment.findById(commentId);
                if (!comment) return null;

                // Récupérer tous les commentaires qui répondent à ce commentaire
                const replies = await Comment.find({ idCommentResponse: commentId });
                
                // Récupérer récursivement les réponses de chaque réponse
                const nestedReplies = await Promise.all(
                    replies.map(reply => getNestedComments(reply._id))
                );

                // Filtrer les réponses null et structurer la réponse
                const validReplies = nestedReplies.filter(reply => reply !== null);

                return {
                    ...comment.toObject(),
                    replies: validReplies
                };
            };

            const commentWithNestedReplies = await getNestedComments(commentId);
            res.status(200).json(commentWithNestedReplies);

        } catch (err) {
            console.error('Erreur lors de la récupération du commentaire:', err);
            res.status(500).json({ error: "Erreur serveur", details: err.message });
        }

    },

    getAllUserComment: async (req, res) => {

        const { authorId } = req.params;

        try {

            const comments = await Comment.find({ authorId });
            res.status(200).json(comments);

        } catch (err) {
            res.status(500).json(err);
        }

    },

    getNbCommentBreez : async (req, res) => {
        const {breezId} = req.params;
        try {
            const breezs = await Comment.find({breezId});

            console.log(breezs);

            if (breezs) {
                const nbComment = breezs.length;
                res.status(200).json({"nbComment": nbComment})
            } else {
                res.status(404).json({message: "Le Breez n'a pas été trouvé !"})
            }

        } catch (err) {
            res.status(500).json(err);
        }
    } ,
    
    deleteCommentsByPost : async (req, res) => {
        const { breezId } = req.params;

        try {
            const result = await Comment.deleteMany({ breezId: breezId });
            res.status(200).json({ message: "Commentaires supprimés", count: result.deletedCount });
        } catch (err) {
            res.status(500).json({ error: "Erreur serveur", details: err });
        }
    }
  
};
