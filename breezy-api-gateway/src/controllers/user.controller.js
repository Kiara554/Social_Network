// Initialisation d'un tableau vide pour stocker les tâches.
const Profile = require("../models/profile.model");

module.exports = {

    // Créer un nouveau profil
    createProfile : async (req, res) => {
        try {
            const { userId, profileImage, biographie } = req.body;

            const newProfile = new Profile({
                userId,
                profileImage,
                biographie
            });

            const savedProfile = await newProfile.save();
            res.status(201).json(savedProfile);
        } catch (error) {
            res.status(500).json({ message: "Erreur lors de la création du profil", error });
        }
    },

    // Récupérer tous les profils
    getAllProfiles : async (req, res) => {
        try {
            const profiles = await Profile.find();
            res.status(200).json(profiles);
        } catch (error) {
            res.status(500).json({ message: "Erreur lors de la récupération des profils", error });
        }
    },

// Récupérer un profil par ID
    getProfileById : async (req, res) => {
        try {
            const profile = await Profile.findById(req.params.id);
            if (!profile) return res.status(404).json({ message: "Profil non trouvé" });
            res.status(200).json(profile);
        } catch (error) {
            res.status(500).json({ message: "Erreur lors de la récupération du profil", error });
        }
    },

    // Mettre à jour un profil
    updateProfile : async (req, res) => {
        try {
            const { profileImage, biographie } = req.body;
            const updatedProfile = await Profile.findByIdAndUpdate(
                req.params.id,
                { profileImage, biographie },
                { new: true, runValidators: true }
            );
            if (!updatedProfile) return res.status(404).json({ message: "Profil non trouvé" });
            res.status(200).json(updatedProfile);
        } catch (error) {
            res.status(500).json({ message: "Erreur lors de la mise à jour du profil", error });
        }
    },

    // Supprimer un profil
    deleteProfile : async (req, res) => {
        try {
            const deletedProfile = await Profile.findByIdAndDelete(req.params.id);
            if (!deletedProfile) return res.status(404).json({ message: "Profil non trouvé" });
            res.status(200).json({ message: "Profil supprimé avec succès" });
        } catch (error) {
            res.status(500).json({ message: "Erreur lors de la suppression du profil", error });
        }
    }


};


