const Like = require("../models/likereplycomment.model");

module.exports = {
  likeReplyComment: async (req, res) => {
    const { authorId, replyCommentId } = req.body;

    try {
      const newLike = new Like({
        authorId,
        replyCommentId
      });

      await newLike.save();
      res.status(201).json({ message: "Like ajouté à la réponse", newLike });
    } catch (err) {
      res.status(500).json({ error: "Erreur serveur", details: err });
    }
  }
};
