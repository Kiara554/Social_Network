// Import de la bibliothèque Mongoose pour interagir avec MongoDB
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    authorId: {
        type: String,
        required: true,
    },
    authorUserName: {
        type: String,
        required: true,
    },
    breezId: {
        type : mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },
    textContent: {
        type: String,
        required: true,
    },
    createdAt: { 
        type: Date,
        default: Date.now,
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
    idCommentResponse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null,
    },


});

const Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment;
