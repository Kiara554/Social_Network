const Follow = require("../models/follow.model");

module.exports = {

    followUser: async (req, res) => {

        const {authorId, authorIdFollowed} = req.body;

        if (authorId === authorIdFollowed) {
            return res.status(400).json({message: "Tu ne peux pas te suivre toi-même."});
        }

        try {

            const existingFollow = await Follow.findOne({authorId, authorIdFollowed});

            if (existingFollow) {
                return res.status(400).json({message: "Tu suis déjà cet utilisateur."});
            }

            const newFollow = new Follow({authorId, authorIdFollowed});
            await newFollow.save();
            res.status(201).json({message: "Utilisateur suivi avec succès", newFollow});
        } catch (err) {
            res.status(500).json({error: "Erreur serveur", details: err});
        }
    },

    unfollowUser: async (req, res) => {
        const { authorId, authorIdFollowed } = req.params; // Récupère les IDs des paramètres de l'URL

        try {
            const deleted = await Follow.findOneAndDelete({authorId, authorIdFollowed});

            console.log(deleted);

            if (deleted) {
                return res.status(200).json({message: "Désabonnement effectué avec succès"});
            } else {
                return res.status(404).json({message: "Relation de suivi non trouvée"});
            }
        } catch (err) {
            res.status(500).json({error: "Erreur serveur", details: err});
        }
    },

    // récupère les abonnés d'un utilisateur
    getFollowers: async (req, res) => {
        const {id} = req.params;

        try {
            const followers = await Follow.find({authorIdFollowed: id});
            res.status(200).json(followers);
        } catch (err) {
            res.status(500).json({error: "Erreur serveur", details: err});
        }
    },

    // récupère les utilisateurs suivis par un utilisateur
    getFollowing: async (req, res) => {
        const {id} = req.params;

        try {
            const following = await Follow.find({authorId: id});
            res.status(200).json(following);
        } catch (err) {
            res.status(500).json({error: "Erreur serveur", details: err});
        }
    },

    // Vérifie si un utilisateur suit un autre utilisateur
    isSubscribed: async (req, res) => {
        const {authorId, authorIdFollowed} = req.params;

        try {
            const existingFollow = await Follow.findOne({authorId, authorIdFollowed});

            if (existingFollow) {
                // If a document is found, it means authorId follows authorIdFollowed
                res.status(200).json({isSubscribed: true});
            } else {
                // If no document is found, it means authorId does not follow authorIdFollowed
                res.status(200).json({isSubscribed: false});
            }
        } catch (err) {
            res.status(500).json({error: "Erreur serveur", details: err});
        }

    },

};
