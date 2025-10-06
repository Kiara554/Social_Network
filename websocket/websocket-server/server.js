const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Permettre la connexion depuis votre application Next.js
        methods: ["GET", "POST"]
    }
});

const PORT = 3099;

const userSockets = {};
// Store conversation participants for quick lookup
const conversationParticipants = {}; // { conversationId: [userId1, userId2, ...] }


function emitAllConnectedUsers() {
    const connectedUserIds = Object.keys(userSockets);
    io.emit('alluserconnected', connectedUserIds);
    console.log('Emitted alluserconnected:', connectedUserIds);
}


// Émission régulière toutes les 10 secondes (modifiable)
setInterval(() => {
    emitAllConnectedUsers();
}, 1000); // 1 000 ms = 1 sec

io.on('connection', (socket) => {
    const userId = socket.handshake.auth.userId;

    if (userId) {
        console.log(`Un utilisateur est connecté: ${userId} avec le socket ID: ${socket.id}`);
        userSockets[userId] = socket.id;
        socket.userId = userId;

        // Fetch conversation participants for the newly connected user and store them
        // This part assumes you have an API endpoint to get conversation details.
        // For simplicity, we'll assume conversations are known or fetched on demand.
        // In a real app, you might fetch this when a user connects or joins a room.
        // Example: If a user connects, you might query your DB for all conversations they are part of.
        // For now, let's rely on the 'typing' event to carry conversationId.

        emitAllConnectedUsers();
    } else {
        console.log(`Un utilisateur anonyme est connecté avec le socket ID: ${socket.id}`);
    }

    socket.on('private_message', ({ to, conversationId, ...messageData }) => {
        console.log(`Message de ${messageData.from} vers ${to}: "${messageData.content}"`);

        const recipientSocketId = userSockets[to];

        if (recipientSocketId) {
            io.to(recipientSocketId).emit('private_message', {
                ...messageData,
                to,
                conversationId,
            });
            console.log("notified !");
        } else {
            console.log(`L'utilisateur ${to} n'est pas connecté.`);
            socket.emit('error_message', `L'utilisateur ${to} est hors ligne.`);
        }
    });

    // Handle 'typing' events
    socket.on('typing', ({ conversationId, userId, isTyping }) => {
        // Find all participants in the conversation (excluding the sender)
        // You would typically get this from your database or a cached list.
        // For now, let's assume `selectedConversation.participants` is available on the client
        // and we are just re-emitting to everyone in that conversation who is connected.
        console.log(`User ${userId} in conversation ${conversationId} is typing: ${isTyping}`);

        // Emit the 'typing' event to all other clients in the specific conversation
        // A more robust solution would involve rooms, but for direct messaging,
        // we can iterate through participants or have a mapping.
        // For simplicity, let's just broadcast to all other connected users.
        // In a real application, you'd send this only to other participants in the `conversationId`.

        // To correctly send only to other participants of that conversation,
        // you'd need a way to know all participants of `conversationId` on the server.
        // Let's simulate this by assuming `conversationParticipants[conversationId]` exists.
        // You would need to populate `conversationParticipants` when users connect or select conversations.
        // A simpler approach for now is to broadcast to all, and client filters.
        // For a direct conversation, there are only two participants.

        // Find the other participant's userId in the conversation
        // This requires the server to know which users are in which conversation.
        // You might need to add a way for the client to tell the server what conversation it's in.
        // For direct messages, we can just send to the recipient.

        // Re-emit the typing event to the other participant in the conversation
        // This assumes that the 'conversationId' uniquely identifies a 1-on-1 conversation
        // and you can determine the 'other' participant based on `userId` and `conversationId`.

        // A more scalable approach would be to use Socket.io Rooms.
        // When a user selects a conversation, they "join" a room corresponding to the `conversationId`.
        // Then, the typing event can be emitted to `io.to(conversationId).emit('typing', ...)`.

        // --- Basic implementation without rooms (assuming we can get the other participant's ID) ---
        // This part needs refinement based on how your `conversationId` maps to participants.
        // If `conversationId` is only known client-side, the server needs to fetch it or the client needs to send it.

        // For now, let's just broadcast the typing event to the relevant recipient.
        // This is a simplification; in a real app, you'd likely use rooms.
        // The `conversationId` is crucial for the client to filter which typing status to display.
        io.emit('typing', { conversationId, userId, isTyping }); // Broadcast to all for now, client filters.
        // A more targeted approach would be:
        // const otherParticipantId = getOtherParticipantIdFromConversation(conversationId, userId); // You need this function
        // if (otherParticipantId && userSockets[otherParticipantId]) {
        //     io.to(userSockets[otherParticipantId]).emit('typing', { conversationId, userId, isTyping });
        // }
    });


    // --- New Event: notify-liked ---
    socket.on('notify-liked', ({ postId, likerId, postAuthorId }) => {
        console.log(`Post ${postId} was liked by ${likerId}. Notifying author ${postAuthorId}.`);

        const authorSocketId = userSockets[postAuthorId];

        if (authorSocketId) {
            io.to(authorSocketId).emit('post-liked-notification', {
                postId,
                likerId,
                timestamp: new Date().toISOString()
            });
            console.log(`Notification sent to ${postAuthorId} for post ${postId}`);
        } else {
            console.log(`Author ${postAuthorId} is not connected. Cannot send like notification.`);
            // You might want to store this notification in a database for later retrieval
            // when the author comes online.
        }
    });
    // --- End New Event ---


    // --- New Event: notify-liked ---
    socket.on('notify-subscribed', ({ subscriberId, subscribingId }) => {
        console.log(`${subscriberId} is now subscribed to ${subscribingId}.`);

        const authorSocketId = userSockets[subscribingId];

        if (authorSocketId) {
            io.to(authorSocketId).emit('post-subscribed-notification', {
                subscriberId,
                subscribingId,
                timestamp: new Date().toISOString()
            });
        } else {
            console.log(`Author ${subscribingId} is not connected. Cannot send like notification.`);
            // You might want to store this notification in a database for later retrieval
            // when the author comes online.
        }
    });


    socket.on('disconnect', () => {
        if (socket.userId && userSockets[socket.userId]) {
            delete userSockets[socket.userId];
            console.log(`L'utilisateur ${socket.userId} est déconnecté.`);
            emitAllConnectedUsers(); // Update connected users list on disconnect
        } else {
            console.log(`Un utilisateur anonyme est déconnecté: ${socket.id}`);
        }
    });

});

server.listen(PORT, () => {
    console.log(`Serveur Socket.io en écoute sur le port ${PORT}`);
});