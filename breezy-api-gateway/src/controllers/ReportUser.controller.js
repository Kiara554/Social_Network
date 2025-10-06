const Report = require('../models/ReportUser.model');

module.exports = {
  
  createReport: async (req, res) => {
    try {
      const { reporterId, reportedUserId, reportedPostId } = req.body;

      if (!reporterId || (!reportedUserId && !reportedPostId)) {
        return res.status(400).json({ message: 'Champs requis manquants' });
      }

      const newReport = new Report({ reporterId, reportedUserId, reportedPostId });
      const savedReport = await newReport.save();
      res.status(201).json(savedReport);
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la création du signalement', error });
    }
  },

  // Récupérer tous les signalements
  getAllReports: async (req, res) => {
    try {
      const reports = await Report.find().sort({ createdAt: -1 });
      res.status(200).json(reports);
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la récupération des signalements', error });
    }
  },

  // Modifier le statut d’un signalement
  updateReportStatus: async (req, res) => {
    try {
      const { status } = req.body;
      const id = req.params.id;

      if (!['pending', 'reviewed', 'ignored'].includes(status)) {
        return res.status(400).json({ message: 'Statut invalide' });
      }

      console.log(status);
      console.log(id);

      const updated = await Report.findByIdAndUpdate(id, { status }, { new: true });
      if (!updated) return res.status(404).json({ message: 'Signalement non trouvé' });

      res.status(200).json(updated);
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la mise à jour du signalement', error });
    }
  },

  // Supprimer un signalement
  deleteReport: async (req, res) => {
    try {
      const deleted = await Report.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ message: 'Signalement non trouvé' });

      res.status(200).json({ message: 'Signalement supprimé avec succès' });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la suppression du signalement', error });
    }
  }
};
