const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporterId: { type: String, required: true }, // L'utilisateur qui signale
  reportedUserId: { type: String, required: false }, // L'utilisateur signalé (optionnel si post/commentaire)
  reportedPostId: { type: String, required: false }, // Post signalé
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'reviewed', 'ignored'], default: 'pending' }
});



module.exports = mongoose.model('Report', reportSchema);
