// Import de la bibliothèque Mongoose pour interagir avec MongoDB
const mongoose = require('mongoose');


const notifySchema = new mongoose.Schema({
    userId: {
        // type: mongoose.Schema.Types.ObjectId,
        type: String,
        required: true,
        // ref: 'User'
    },
    notifyType: {
        type: String,
        enum: ['LIKE', 'MESSAGE', 'COMMENT', 'SUBSCRIBE'], // Replace with your actual choices
        required: true
    },
    notifyContent: {
        type: String,
        required: true,
    },
    readValue: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true // This will automatically add createdAt and updatedAt fields
});

const Notify = mongoose.model("Notify", notifySchema);


module.exports = Notify;

