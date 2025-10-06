// Initialisation d'un tableau vide pour stocker les tâches.
const Breez = require("../models/breez.model");

module.exports = {

    createBreez: async (req, res) => {

        const {authorId, authorUserName, textContent, mediaUrl, mediaType, createdAt} = req.body;

        if (mediaUrl && (!mediaType || !['image', 'video'].includes(mediaType))) {
            return res.status(400).send("Media type must be 'image' or 'video' if mediaUrl is provided");
        }

        // Vérification que le titre et le contenu sont présents.
        // Si l'un des deux est manquant, on retourne une réponse avec un statut 400 (Bad Request).
        //if (!authorName || !authorHandle || !textContent || createdAt) return res.status(400).send("Title and content are required");

        try {
            // Création d'un nouvel objet tâche avec le titre et le contenu fournis.

            const newPost = new Breez({authorId, authorUserName, textContent, mediaUrl, mediaType, createdAt});
            await newPost.save();

            // Ajout de la nouvelle tâche dans le tableau tasksList.
            // tasksList.push(newTask);

            // Envoi d'une réponse avec un statut 201 (Created) pour indiquer que la tâche a été créée avec succès.
            res.status(201).send("Task created successfully");

        } catch (err) {
            // En cas d'erreur, envoi d'une réponse avec un statut 500 (Internal Server Error)
            // et l'erreur sous forme de JSON.
            res.status(500).json(err);
        }

    },

    getAllBreez: async (req, res) => {

        const sortBy = 'createdAt';
        const sortOrder = 'desc';

        // Determine the sort direction for Mongoose
        const sortDirection = sortOrder === 'asc' ? 1 : -1;


      try {

        // Create a sort object
        const sort = {};
        sort[sortBy] = sortDirection;

            const breezs = await Breez.find().sort(sort);
            res.status(200).json(breezs);

        } catch (err) {
            // En cas d'erreur, envoi d'une réponse avec un statut 500 (Internal Server Error)
            // et l'erreur sous forme de JSON.
            res.status(500).json(err);
        }

    },

    updateBreez: async (req, res) => {
        const {id} = req.params;
        const updateData = req.body;

        try {
            const updatedBreez = await Breez.findByIdAndUpdate(id, updateData, {new: true});
            if (!updatedBreez) return res.status(404).send("Breez not found");
            res.status(200).json(updatedBreez);
        } catch (err) {
            res.status(500).json(err);
        }
    },

    getBreez: async (req, res) => {
        const {id} = req.params;

        try {
            const breez = await Breez.findById(id);
            res.status(200).json(breez);

        } catch (err) {
            // En cas d'erreur, envoi d'une réponse avec un statut 500 (Internal Server Error)
            // et l'erreur sous forme de JSON.
            res.status(500).json(err);
        }
    },

    getAllUserBreez: async (req, res) => {
        const {authorId} = req.params;

        const sortBy = 'createdAt';
        const sortOrder = 'desc';

      // Determine the sort direction for Mongoose
      const sortDirection = sortOrder === 'asc' ? 1 : -1;

        try {

          // Create a sort object
          const sort = {};
          sort[sortBy] = sortDirection;

            const breezs = await Breez.find({ authorId }).sort(sort);
            res.status(200).json(breezs);

        } catch (err) {
            // En cas d'erreur, envoi d'une réponse avec un statut 500 (Internal Server Error)
            // et l'erreur sous forme de JSON.
            res.status(500).json(err);
        }

    },

  // supprimer un breez en mettant deletedAt à true
  deleteBreez: async (req, res) => {
    const { id } = req.params;

    try {
      const breez = await Breez.findByIdAndDelete( id );
      if (!breez) return res.status(404).send("Breez not found");
      res.status(200).json(breez);
    } catch (err) {
      res.status(500).json(err);
    }
  }


};
