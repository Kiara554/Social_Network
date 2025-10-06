const mongoose = require('mongoose');

const reportBreezSchema = new mongoose.Schema({
    reporterId: { type: String, required: true },
    reportedPostId: { type: String, required: true },
    reportedUserId: { type: String, required: false },
    status: { type: String, enum: ['pending', 'reviewed', 'ignored'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ReportBreez', reportBreezSchema);
