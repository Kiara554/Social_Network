// Import de la bibliothèque Mongoose pour interagir avec MongoDB
const mongoose = require('mongoose');
const commentSchema = require('./commentschema.model');
// Importe le schéma de commentaire depuis son propre fichier
// const commentSchema = require('./commentschema.model'); // Assurez-vous que le chemin est correct


const breezSchema = new mongoose.Schema({
    authorId: {
        // type: mongoose.Schema.Types.ObjectId,
        type: String,
        required: true,
        // ref: 'User'
    },
    authorUserName: {
        type: String,
        required: true,
    },
    profilePic: {
        type: String,
        default: "https://via.placeholder.com/48/6A0572/FFFFFF?text=RS",
    },
    textContent: {
        type: String,
        required: true,
    },
    mediaUrl: {
        type: String,
        default: null,
    },

    mediaType: {
        type: String,
        enum: ['image', 'video', null],
        default: null,
    },

    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    createdAt: { // Horodatage précis de la création du post
      type: Date,
      default: Date.now,
    },

});

const Breez = mongoose.model("Breez", breezSchema);


module.exports = Breez;

