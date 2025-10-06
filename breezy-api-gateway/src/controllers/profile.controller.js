// Initialisation d'un tableau vide pour stocker les tâches.
const Profile = require("../models/profile.model");

const axios = require('axios');

axios.defaults.headers.common['X-Api-Key'] = `$key&frontend£breezy/2025/yb$*$$$daz*$bdz££bd=+zj`;



module.exports = {

    // Créer un nouveau profil
    createProfile: async (req, res) => {
        try {
            const { userId } = req.body;

            const profile = await Profile.findOne({ userId });

            console.log(profile);

            if(!profile) {

                const newProfile = new Profile({
                    userId
                });

                const savedProfile = await newProfile.save();
                res.status(201).json(savedProfile);

            }

            console.log("Connexion !");

            //
            res.status(200).json(profile);

        } catch (error) {
            res.status(500).json({message: "Erreur lors de la création du profil", error});
        }
    },

    // Récupérer tous les profils
    getAllProfiles: async (req, res) => {
        try {
            // Récupère tous les profils MongoDB
            const profiles = await Profile.find();

            // Appel à l’API externe pour récupérer tous les utilisateurs
            const response = await axios.get(`${process.env.URL_API_AUTH_USERS}/getAllUsers`);
            const allUsers = response.data; // tableau d'utilisateurs

            console.log(allUsers);

            // Fusionne chaque profil avec son utilisateur correspondant
            const mergedProfiles = profiles.map(profile => {
                const user = allUsers.find(u => String(u.user_id) === profile.userId);
                const merged = { ...user, ...profile.toObject() };
                delete merged.userId;
                return merged;
            });

            res.status(200).json(mergedProfiles);
        } catch (error) {
            console.error("❌ Erreur lors de la récupération des profils :", error.message);
            res.status(500).json({ message: "Erreur lors de la récupération des profils", error });
        }
    },

// Récupérer un profil par ID
    getProfileById: async (req, res) => {
        try {

            console.log(req.params.id);

            const response = await axios.get(`${process.env.URL_API_AUTH_USERS}/${req.params.id}`,
                {
                    timeout: 5000, // timeout de 5 secondes
                }
                );
            const userData = response.data;

            console.log(response.data);

            const profile = await Profile.findOne({ userId: req.params.id });

            // Trouve l’utilisateur correspondant à ce userId dans la réponse externe
            const user = userData.find(u => String(u.user_id) === profile.userId);

            // Fusionne les deux objets (user + profil Mongo)
            const merged = { ...user, ...profile.toObject() };
            delete merged.userId;

            if (!profile) return res.status(404).json({message: "Profil non trouvé"});
            res.status(200).json(merged);
        } catch (error) {
            res.status(500).json({message: "Erreur lors de la récupération du profil", error});
        }
    },

    // Mettre à jour un profil
    updateProfile: async (req, res) => {
        try {
            const {profileImage, biographie} = req.body;
            const userId = req.params.id;

            console.log(userId);


            const updatedProfile = await Profile.findOneAndUpdate(
                { userId }, // filter by userId
                {profileImage, biographie},
                {new: true, runValidators: true}
            );
            if (!updatedProfile) return res.status(404).json({message: "Profil non trouvé"});
            res.status(200).json(updatedProfile);
        } catch (error) {
            res.status(500).json({message: "Erreur lors de la mise à jour du profil", error});
        }
    },

    // Mettre à jour un profil
    updateUser: async (req, res) => {
        try {
            const { email, username } = req.body;
            const userId = req.params.id;

            console.log(userId);

            const response = await axios.patch(
                `${process.env.URL_API_AUTH_USERS}/updateIdentifiers/${userId}`, {
                    email : email,
                    username: username,
                })


            if (response.status !== 200) {
                res.status(404).json({message: "Erreur lors de la mise à jour du profil"});
            }

            res.status(200).json({message: "Update user success"});

        } catch (error) {
            res.status(500).json({message: "Erreur lors de la mise à jour du profil", error});
        }
    },

    // Supprimer un profil
    deleteProfile: async (req, res) => {
        try {
            const deletedProfile = await Profile.findByIdAndDelete(req.params.id);
            if (!deletedProfile) return res.status(404).json({message: "Profil non trouvé"});
            res.status(200).json({message: "Profil supprimé avec succès"});
        } catch (error) {
            res.status(500).json({message: "Erreur lors de la suppression du profil", error});
        }
    },

    //bannir un user
    isBannedUpdate: async (req, res) => {
        try {
            const { ban } = req.body;
            const userId = req.params.id;

            console.log(userId);
            console.log(ban);

            const response = await axios.patch(
                `${process.env.URL_API_AUTH_USERS}/updateIsBanned/${userId}`, {
                    ban: ban,
                })

            console.log(response);


            if (response.status !== 200) {
                res.status(404).json({message: "Erreur lors de la mise à jour du profil"});
            }

            res.status(200).json({message: "Update user success"});

        } catch (error) {
            res.status(500).json({message: "Erreur lors de la mise à jour du profil", error});
        }
    },



};


