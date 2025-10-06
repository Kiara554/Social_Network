const ReportBreez = require('../models/ReportBreez.model');
const axios = require('axios');

module.exports = {

  createReport: async (req, res) => {
    try {
      const { reporterId, reportedPostId, reportedUserId } = req.body;

      if (!reporterId || !reportedPostId) {
        return res.status(400).json({ message: "Champs obligatoires manquants" });
      }

      // Créer le signalement
      const newReport = new ReportBreez({ reporterId, reportedPostId, reportedUserId });
      const savedReport = await newReport.save();

      res.status(201).json({ message: "Signalement enregistré ", report: savedReport });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur lors du signalement du Breez", error });
    }
  },

  getAllReports: async (req, res) => {
    try {
      const reports = await ReportBreez.find().sort({ createdAt: -1 });
      res.status(200).json(reports);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération", error });
    }
  },

  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['pending', 'reviewed', 'ignored'].includes(status)) {
        return res.status(400).json({ message: "Statut invalide" });
      }

      const updated = await ReportBreez.findByIdAndUpdate(id, { status }, { new: true });
      if (!updated) return res.status(404).json({ message: "Signalement introuvable" });

      res.status(200).json(updated);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour", error });
    }
  },

  deleteReport: async (req, res) => {
    try {
      const deleted = await ReportBreez.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Introuvable" });
      res.status(200).json({ message: "Signalement supprimé avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression", error });
    }
  }
};
