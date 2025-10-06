const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
    authorId: {
        type: String,
        require : true,
    },
    authorIdFollowed: {
        type: String,
        require : true,
    },
    followedAt: { // Horodatage précis de la création du post
    type: Date,
    default: Date.now,
    }



});

const Follow = mongoose.model("Follow", followSchema);


module.exports = Follow;