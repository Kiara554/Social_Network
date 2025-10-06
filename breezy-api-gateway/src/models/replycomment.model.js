// Import de la bibliothèque Mongoose pour interagir avec MongoDB
const mongoose = require('mongoose');

const ReplycommentSchema = new mongoose.Schema({
    authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    },
    commentId: {
        type : mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },
    textContent: {
        type: String,
        required: true,
    },
    likes: {
        type: Number,
        default: 0,
    },
    createdAt: { 
        type: Date,
        default: Date.now,
    },

 
});

const Replycomment = mongoose.model("Replycomment", ReplycommentSchema);
module.exports = Replycomment;

