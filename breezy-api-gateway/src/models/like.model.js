const mongoose = require('mongoose');

const likeschema = new mongoose.Schema({
  authorId: {
    // type: mongoose.Schema.Types.ObjectId,
    type: String,
    required: true,
    ref: 'User'
  },
  commentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  replyCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Replycomment',
    default: null
  },
  breezId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Breez',
    default: null
  },

  likeAt: {
    type: Date,
    default: Date.now
  }
});


const Like = mongoose.model("Like", likeschema);
module.exports = Like;
