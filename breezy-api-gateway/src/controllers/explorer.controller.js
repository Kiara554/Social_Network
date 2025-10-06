const Breez = require('../models/breez.model');

const handleExplorer = async (req, res) => {
    const q = req.query.q;

    if (!q || q.trim() === '') {
        return res.status(400).json({ posts: [], users: [], userPosts: [], message: 'Query vide.' });
    }

    try {
        // Rechercher les posts contenant le texte
        const posts = await Breez.find({
            textContent: { $regex: q, $options: 'i' }
        }).limit(20);

        // Rechercher les utilisateurs dont le nom correspond
        const users = await Breez.aggregate([
            {
                $match: {
                    authorUserName: { $regex: q, $options: 'i' }
                }
            },
            {
                $group: {
                    _id: "$authorId",
                    username: { $first: "$authorUserName" },
                    profilePic: { $first: "$profilePic" }
                }
            },
            {
                $limit: 10
            }
        ]);

        // Récupérer les IDs des utilisateurs trouvés
        const matchedUserIds = users.map(u => u._id);

        // Récupérer tous les posts de ces utilisateurs
        const userPosts = await Breez.find({
            authorId: { $in: matchedUserIds }
        }).limit(20);

        res.json({ posts, users, userPosts });

    } catch (err) {
        console.error("Erreur explorer :", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

const getRecentPosts = async (req, res) => {
    try {
        const posts = await Breez.find({})
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({ posts });
    } catch (err) {
        console.error("Erreur lors de la récupération des posts récents :", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

module.exports = { handleExplorer, getRecentPosts };
