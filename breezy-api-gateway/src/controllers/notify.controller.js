const Notify = require("../models/notify.model"); // Assuming your model is in ../models/notify.model.js

module.exports = {

    // Create a new notification
    createNotification: async (req, res) => {

        const { userId, notifyType, notifyContent } = req.body;

        console.log(userId);

        try {
            const newNotification = new Notify({ userId, notifyType, notifyContent });
            await newNotification.save();
            res.status(201).json(newNotification); // Send back the created notification
        } catch (err) {
            res.status(500).json({ message: "Error creating notification", error: err.message });
        }
    },

    // Get all notifications (consider adding pagination/filtering for large datasets)
    getAllNotifications: async (req, res) => {
        const sortBy = 'createdAt';
        const sortOrder = 'desc'; // Most recent notifications first

        const sortDirection = sortOrder === 'asc' ? 1 : -1;

        try {
            const notifications = await Notify.find().sort({ [sortBy]: sortDirection });
            res.status(200).json(notifications);
        } catch (err) {
            res.status(500).json({ message: "Error fetching all notifications", error: err.message });
        }
    },

    // Get a single notification by its ID
    getNotificationById: async (req, res) => {
        const { id } = req.params;

        try {
            const notification = await Notify.findById(id);
            if (!notification) {
                return res.status(404).send("Notification not found");
            }
            res.status(200).json(notification);
        } catch (err) {
            // Check if the error is due to an invalid ObjectId format
            if (err.name === 'CastError' && err.kind === 'ObjectId') {
                return res.status(400).send("Invalid Notification ID format.");
            }
            res.status(500).json({ message: "Error fetching notification", error: err.message });
        }
    },

    // Get all notifications for a specific user
    getUserNotifications: async (req, res) => {
        const { userId } = req.params; // Assuming userId is passed as a URL parameter

        const sortBy = 'createdAt';
        const sortOrder = 'desc';

        const sortDirection = sortOrder === 'asc' ? 1 : -1;

        try {
            const notifications = await Notify.find({ userId }).sort({ [sortBy]: sortDirection });
            res.status(200).json(notifications);
        } catch (err) {
            res.status(500).json({ message: "Error fetching user notifications", error: err.message });
        }
    },

    // Update a notification (e.g., mark as read)
    updateNotification: async (req, res) => {
        const { id } = req.params;
        const {updateData = { readValue: true } } = req.body; // Expects fields like { readValue: true }

        try {
            const updatedNotification = await Notify.findByIdAndUpdate(id, updateData, { new: true });
            if (!updatedNotification) {
                return res.status(404).send("Notification not found");
            }
            res.status(200).json(updatedNotification);
        } catch (err) {
            // Check if the error is due to an invalid ObjectId format
            if (err.name === 'CastError' && err.kind === 'ObjectId') {
                return res.status(400).send("Invalid Notification ID format.");
            }
            res.status(500).json({ message: "Error updating notification", error: err.message });
        }
    },

    // Delete a notification
    deleteNotification: async (req, res) => {
        const { id } = req.params;

        try {
            const deletedNotification = await Notify.findByIdAndDelete(id);
            if (!deletedNotification) {
                return res.status(404).send("Notification not found");
            }
            res.status(200).send("Notification deleted successfully");
        } catch (err) {
            // Check if the error is due to an invalid ObjectId format
            if (err.name === 'CastError' && err.kind === 'ObjectId') {
                return res.status(400).send("Invalid Notification ID format.");
            }
            res.status(500).json({ message: "Error deleting notification", error: err.message });
        }
    },

    // Mark all notifications for a user as read
    markAllUserNotificationsAsRead: async (req, res) => {
        const { userId } = req.params;

        try {
            // Find all unread notifications for the user and update them
            const result = await Notify.updateMany(
                { userId: userId, readValue: false },
                { $set: { readValue: true } }
            );
            // result.nModified will give the number of documents modified
            res.status(200).json({ message: `${result.nModified} notifications marked as read for user ${userId}.` });
        } catch (err) {
            res.status(500).json({ message: "Error marking notifications as read", error: err.message });
        }
    }
};