 
 const Replycomment = require("../models/replycomment.model");
 
module.exports = {
ReplyCommentBreez: async (req, res) => {
    
    const { authorId, commentId, textContent } = req.body;

    try {
     

      const ReplyComment = new Replycomment({
        authorId,
        commentId,
        textContent
      });
     
      await ReplyComment.save();
   
      res.status(201).json({ message: "Réponse ajoutée", ReplyComment });
    } catch (err) {
      res.status(500).json({ error: "Erreur serveur", details: err });
    }
  },
  
};
