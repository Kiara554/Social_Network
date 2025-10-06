const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: String,
    }],
    messages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: []
    }],
    lastMessageAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;