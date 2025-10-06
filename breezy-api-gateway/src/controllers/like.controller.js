const Like = require("../models/like.model");
const Breez = require("../models/breez.model");


module.exports = {

    createLike: async(req, res) => {

        const {authorId, commentId, breezId } = req.body;

        try {
            const newLike = new Like({authorId, commentId, breezId});
            await newLike.save();
            res.status(201).json({ message: "Like ajouté", newLike });
        } catch (err) {
            res.status(500).json({ error: "Erreur serveur", details: err });
        }

    },

    alreadylike: async (req, res) => {

        const { userid, breezId } = req.params;
        const authorId = userid;

        try {
            const like = await Like.findOne({authorId, breezId});

            if (like) {
                return res.status(200).json( true );
            } else {
                return res.status(200).json(false );
            }
        } catch (err) {
            res.status(500).json({ error: "Erreur serveur", details: err });
        }

    },

    deleteLike: async (req, res) => {

        const { authorId, breezId } = req.params;

        try {

            const deleted = await Like.findOneAndDelete({ authorId, breezId });

            if (deleted) {
                return res.status(200).json({ message: "Like supprimé", deleted });
            } else {
                return res.status(404).json({ message: "Aucun like trouvé à supprimer" });
            }
        } catch (err) {
            res.status(500).json({ error: "Erreur serveur", details: err });
        }
    },

    getNbLikeBreez : async (req, res) => {

        const {breezId} = req.params;

        try {
            const breezs = await Like.find({breezId});

            console.log(breezs);

            if (breezs) {
                const nbLikes = breezs.length;
                res.status(200).json({"nbLikes": nbLikes})
            } else {
                res.status(404).json({message: "Le Breez n'a pas été trouvé !"})
            }

        } catch (err) {
            res.status(500).json(err);
        }

    } ,

    getAllUserLikes : async (req, res) => {
        const { authorId } = req.params;
        
        try {
          const breezs = await Like.find({ authorId });
          res.status(200).json(breezs);

        } catch (err) {
          // En cas d'erreur, envoi d'une réponse avec un statut 500 (Internal Server Error)
          // et l'erreur sous forme de JSON.
          res.status(500).json(err);
        }
    },


    deleteLikesByPost: async (req, res) => {
        const { breezId } = req.params;

        try {
            const result = await Like.deleteMany({ breezId: breezId });
            res.status(200).json({ message: "Likes supprimés", count: result.deletedCount });
        } catch (err) {
            res.status(500).json({ error: "Erreur serveur", details: err });
        }
    }



};
