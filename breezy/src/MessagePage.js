import React, { useEffect, useState, useRef, useCallback } from 'react';
import Sidebar from './components/sidebar';
import BottomBar from './components/bottombar';
import './MessagePage.css';
import {getCurrentUserId, getCurrentUserName} from "./utils/utils";
// import io from 'socket.io-client'; // Remove this line
// import axios from "axios";
import { useSocket } from './context/SocketContext'; // Import the useSocket hook
import { Link } from 'react-router-dom';
import apiService from './services/apiService';


const MessagesPage = () => {
    // Use the socket and userId from the context
    const { socket, userId, isConnected, connectedUsers, lastPrivateMessage, sendPrivateMessage, setUnreadMessagesCount } = useSocket(); // 👈 maintenant dans le contexte

    // États React pour gérer les données et UI
    // const [userId, setUserId] = useState(null); // Remove or keep if you need local userId state for other reasons, but it will be provided by context
    const [conversations, setConversations] = useState([]);     // Liste des conversations
    const [selectedConversation, setSelectedConversation] = useState(null); // Conversation active
    const [messages, setMessages] = useState([]);               // Messages de la conversation active
    const [newMessage, setNewMessage] = useState('');           // Message en cours de saisie
    const [allUserName, setAllUserName] = useState({});         // Map des IDs utilisateurs vers leurs noms
    // const [connectedUsers, setConnectedUsers] = useState([]);   // Liste des utilisateurs connectés
    const [isLoading, setIsLoading] = useState(true);           // Indicateur de chargement
    const [typingStatus, setTypingStatus] = useState({});       // Statut de saisie pour chaque conversation
    const typingTimeoutRef = useRef(null);                       // Timeout pour arrêter le statut "en train d’écrire"
    const messagesEndRef = useRef(null);                         // Référence pour scroll automatique en bas des messages
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768); // Vue mobile ou desktop

    // Gestion du redimensionnement de la fenêtre pour basculer entre vue mobile/desktop
    useEffect(() => {
        const onResize = () => setIsMobileView(window.innerWidth <= 768);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    // Fonction pour récupérer les noms d’utilisateurs à partir de leurs IDs
    const fetchUserNames = async (ids) => {
        const names = { ...allUserName };
        for (const id of ids) {
            if (!names[id]) { // Si le nom n’est pas déjà en cache
                try {
                    const res = await apiService.gateway.get(`/profile/${id}`);
                    names[id] = res.data?.username || `Inconnu ${id}`;
                } catch {
                    names[id] = `Inconnu ${id}`;
                }
            }
        }
        setAllUserName(names); // Mise à jour de l’état des noms utilisateurs
    };

    // Fonction pour récupérer les conversations de l’utilisateur et leurs participants
    const fetchConversations = async () => {
        setIsLoading(true);
        // We now get userId from context, no need to call getCurrentUserId here
        // const id = userId || await getCurrentUserId();
        // setUserId(id); // If you keep a local userId state, update it here

        if (!userId) { // Wait for userId from context to be available
            setIsLoading(false);
            return;
        }

        try {
            // Récupère les conversations via l’API
            const res = await apiService.gateway.get(`/conversations/${userId}`);
            setConversations(res.data);

            // Récupère tous les participants uniques de ces conversations
            const allIds = new Set();
            res.data.forEach(conv => conv.participants.forEach(p => allIds.add(p)));

            // Récupère les noms des participants via fetchUserNames
            await fetchUserNames(Array.from(allIds));
        } catch (e) {
            console.error("Erreur chargement conversations:", e);
        } finally {
            setIsLoading(false);
        }
    };

    // Centralise les événements liés à la socket
    useEffect(() => {
        if (!socket || !userId) return;

        // Récupération initiale des conversations
        fetchConversations();

        /*// Réception de la liste des utilisateurs connectés
        const handleAllUserConnected = (users) => {
            console.log("Received alluserconnected:", users);
            setConnectedUsers(users);
        };*/

        // Réception des événements "typing"
        const handleTyping = ({ conversationId, userId: typerId, isTyping }) => {
            setTypingStatus(prev => ({
                ...prev,
                [conversationId]: {
                    ...prev[conversationId],
                    [typerId]: isTyping
                }
            }));
        };

        // socket.on('alluserconnected', handleAllUserConnected);
        socket.on('typing', handleTyping);

        return () => {
            // socket.off('alluserconnected', handleAllUserConnected);
            socket.off('typing', handleTyping);
        };
    }, [socket, userId]);

    // Gestion des messages entrants via socket pour la conversation active
    useEffect(() => {
        if (!socket || !isConnected || !selectedConversation) return;

        const handleMessage = async (message) => {
            // Si message reçu provient de l’autre participant, on recharge les messages
            const otherId = selectedConversation.participants.find(p => String(p) !== String(userId));
            if (String(message.from) === String(otherId)) {
                try {
                    const res = await apiService.gateway.get(`/messages/${selectedConversation._id}`);
                    setMessages(res.data);
                } catch (e) {
                    console.error("Error fetching messages after new message:", e);
                }
            }
        };

        socket.on('private_message', handleMessage);
        return () => socket.off('private_message', handleMessage);
    }, [selectedConversation, userId, socket, isConnected]); // Depend on socket and isConnected

    useEffect(() => {
        if (selectedConversation) {
            setUnreadMessagesCount(0); // Réinitialise à 0 quand l'utilisateur lit les messages
        }
    }, [selectedConversation]);

    // Scroll automatique vers le bas à chaque changement des messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Sélectionne une conversation et charge ses messages
    const handleSelectConversation = async (conv) => {
        setSelectedConversation(conv);
        setTypingStatus({}); // Reset du statut de saisie

        try {
            const res = await apiService.gateway.get(`/messages/${conv._id}`);
            setMessages(res.data);
        } catch (e) {
            console.error("Erreur chargement messages:", e);
        }
    };

    // Envoie un message via API (appel POST)
    const sendMessage = async () => {
        await apiService.gateway.post(`/messages`, {
            conversationId: selectedConversation._id,
            sender: userId,
            content: newMessage
        });
    };

    // Envoi de message via formulaire + gestion socket et UI
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation || !socket || !isConnected) return; // Ensure socket is connected

        // Stoppe le statut "en train d'écrire"
        socket.emit('typing', { conversationId: selectedConversation._id, userId, isTyping: false });
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;

        // Trouve le destinataire
        const receiverId = selectedConversation.participants.find(p => String(p) !== String(userId));

        // Envoie le message à l’API
        await sendMessage();

        // Émet l'événement socket avec le nouveau message
        socket.emit('private_message', {
            text: newMessage,
            to: parseInt(receiverId),
            from: userId,
            timestamp: new Date(),
        });

        const username = await getCurrentUserName();
        await apiService.gateway.post(`/notify`, {
            "userId": receiverId,
            "notifyType": "MESSAGE",
            "notifyContent": `Nouveau message de ${username} : ${newMessage} !`,
        })

        // Met à jour localement la liste des messages
        setMessages(prev => [...prev, { content: newMessage, sender: userId }]);

        // Réinitialise le champ de saisie
        setNewMessage('');

        // Recharge les messages (peut être optimisé)
        // Consider if a full reload is necessary or if you can rely on the socket event to update
        await handleSelectConversation(selectedConversation);
    };

    // Gestion du changement de saisie : statut "en train d'écrire" géré avec timeout
    const handleNewMessageChange = (e) => {
        const val = e.target.value;
        setNewMessage(val);

        if (!selectedConversation || !userId || !socket || !isConnected) return; // Ensure socket is connected

        // Si début de saisie, indique qu’on est en train d’écrire
        if (val.length && !typingTimeoutRef.current) {
            socket.emit('typing', { conversationId: selectedConversation._id, userId, isTyping: true });
        }

        // Reset le timeout à chaque nouvelle saisie
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing', { conversationId: selectedConversation._id, userId, isTyping: false });
            typingTimeoutRef.current = null;
        }, 3000);
    };

    // Récupère la liste des utilisateurs en train d’écrire dans une conversation (hors soi-même)
    const getTypingUsers = useCallback((convId) => {
        if (!typingStatus[convId]) return [];
        return Object.entries(typingStatus[convId])
            .filter(([id, typing]) => typing && String(id) !== String(userId))
            .map(([id]) => allUserName[parseInt(id)]);
    }, [typingStatus, allUserName, userId]);

    return (
        <div className="messages-layout">
            <Sidebar userId={userId} activePage="messages" />
            <main className="messages-main-content">
                <div className="chat-container">
                    {/* Liste des conversations visible sur desktop ou si aucune conversation sélectionnée */}
                    {(!isMobileView || !selectedConversation) && (
                        <div className="conversation-list">
                            <header className="conversation-header">
                                <h2>Discussions</h2>
                            </header>
                            {isLoading ? (
                                <div className="loading-placeholder">
                                    <div className="loading-spinner"></div>
                                    <p>Chargement des conversations ...</p>
                                </div>
                            ) : (
                                <ul>
                                    {conversations.map(conv => {
                                        const otherId = conv.participants.find(p => String(p) !== String(userId));
                                        const isConnectedUser = connectedUsers.includes(String(otherId)); // Use isConnectedUser to avoid confusion with context's isConnected
                                        return (
                                            <li
                                                key={conv._id}
                                                className={`conversation-item ${selectedConversation?._id === conv._id ? 'active' : ''}`}
                                                onClick={() => handleSelectConversation(conv)}
                                            >
                                                <Link to={`/messages/${conv._id}`}>
                                                {/* Indicateur de statut en ligne */}
                                                <div className={`status-circle ${isConnectedUser ? "green" : "red"}`}></div>
                                                <i className='avatar fas fa-user-circle'></i>
                                                <div className="conversation-details">
                                                    <span className="conversation-name">{allUserName[parseInt(otherId)]}</span>
                                                    <p className="conversation-preview">
                                                        {conv.messages?.[0]?.content || 'Démarrez la conversation'}
                                                    </p>
                                                </div>
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    )}

                </div>
            </main>

            {/* Barre inférieure visible uniquement en mobile */}
            <div className="mobile-only">
                <BottomBar userId={userId} activePage="messages" />
            </div>
        </div>
    );
};

export default MessagesPage;