// Import de la bibliothèque Mongoose pour interagir avec MongoDB
const mongoose = require('mongoose');


const profileSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    profileImage: {
        type: String,
        default: ''
    },
    biographie: {
        type: String,
        default: ''
    }
},
    {
        timestamps: true
    });

const Profile = mongoose.model("Profile", profileSchema);

// Exporte le modèle Task pour qu'il soit utilisé dans d'autres fichiers
module.exports = Profile;
