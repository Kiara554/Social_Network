import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { getCurrentUserId, getCurrentUserName } from '../utils/utils';
import { toast } from 'react-toastify';
import notificationsSound from '../utils/notification-sound.mp3';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const socketRef = useRef(null);
    const [userId, setUserId] = useState(null);
    const [userName, setUserName] = useState(null);
    const [userRole, setUserRole] = useState('user');
    const [isConnected, setIsConnected] = useState(false);
    const [connectedUsers, setConnectedUsers] = useState([]);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
    const [unreadNotifications, setUnreadNotications] = useState(0);
    const navigate = useNavigate();

    // Initialisation socket
    useEffect(() => {
        const initializeSocket = async () => {
            const currentUserId = await getCurrentUserId();
            const currentUserName = await getCurrentUserName();
            setUserId(currentUserId);
            setUserName(currentUserName);

            const response = await apiService.gateway.get(`/profile/${currentUserId}`);
            setUserRole(response.data.role);

            if (currentUserId && !socketRef.current) {
                const newSocket = io(`${apiService.getApiUrl('socket')}`, {
                    autoConnect: false,
                    auth: { userId: currentUserId },
                });

                socketRef.current = newSocket;

                newSocket.on('connect', () => {
                    console.log('Socket connected:', newSocket.id);
                    setIsConnected(true);
                });

                newSocket.on('disconnect', (reason) => {
                    console.log('Socket disconnected:', reason);
                    setIsConnected(false);
                });

                newSocket.on('connect_error', (error) => {
                    console.error('Socket connection error:', error);
                });

                newSocket.connect();
            }
        };

        initializeSocket();

        return () => {
            if (socketRef.current) {
                console.log('Disconnecting socket on unmount...');
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    // Tous les événements socket
    useEffect(() => {
        const socket = socketRef.current;
        if (!userId || !socket) return;

        const handleAllUserConnected = (users) => setConnectedUsers(users);

        const getNbNotif = async () => {
            try {
                const res = await apiService.gateway.get(`/notify/user/${userId}`);
                const count = res.data.filter(n => !n.readValue).length;
                setUnreadNotications(count);
            } catch (e) {
                console.error("Erreur récupération notifications:", e);
            }
        };

        const handlePm = async (msg) => {
            try {
                const res = await apiService.gateway.get(`/profile/${msg.from}`);
                const username = res.data?.username || `Inconnu ${msg.from}`;

                toast.info(`Nouveau message de ${username}: \n ${msg.content}`, {
                    position: "top-right",
                    autoClose: 5000,
                    onClick: () => navigate(`/messages/${msg.conversationId}`),
                    onOpen: () => new Audio(notificationsSound).play().catch(console.error),
                });
            } catch (err) {
                console.error("Erreur handlePm:", err);
            }
        };

        const handleLike = async (like) => {
            try {
                const res = await apiService.gateway.get(`/profile/${like.likerId}`);
                const username = res.data?.username || `Inconnu ${like.likerId}`;
                toast.info(`${username} a liké votre post !`, {
                    position: "top-right",
                    autoClose: 5000,
                    onOpen: () => new Audio(notificationsSound).play().catch(console.error),
                });
            } catch (e) {
                console.error("Erreur handleLike:", e);
            }
        };

        const handleSubscribe = async (subscribe) => {
            try {
                const res = await apiService.gateway.get(`/profile/${subscribe.subscriberId}`);
                const username = res.data?.username || `Inconnu ${subscribe.subscriberId}`;
                toast.info(`${username} s'est abonné à toi !`, {
                    position: "top-right",
                    autoClose: 5000,
                    onOpen: () => new Audio(notificationsSound).play().catch(console.error),
                });
            } catch (e) {
                console.error("Erreur handleSubscribe:", e);
            }
        };

        // Subscriptions
        socket.on('alluserconnected', handleAllUserConnected);
        socket.on('post-liked-notification', getNbNotif);
        socket.on('post-subscribed-notification', getNbNotif);
        socket.on('private_message', getNbNotif);

        socket.on('private_message', handlePm);
        socket.on('post-liked-notification', handleLike);
        socket.on('post-subscribed-notification', handleSubscribe);

        return () => {
            socket.off('alluserconnected', handleAllUserConnected);
            socket.off('post-liked-notification', getNbNotif);
            socket.off('post-subscribed-notification', getNbNotif);
            socket.off('private_message', getNbNotif);

            socket.off('private_message', handlePm);
            socket.off('post-liked-notification', handleLike);
            socket.off('post-subscribed-notification', handleSubscribe);
        };
    }, [userId, navigate]);

    // Émission d'un PM
    const sendPrivateMessage = (payload) => {
        socketRef.current?.emit('private_message', payload);
    };

    const value = {
        socket: socketRef.current,
        userId,
        userName,
        userRole,
        isConnected,
        connectedUsers,
        sendPrivateMessage,
        unreadMessagesCount,
        setUnreadMessagesCount,
        unreadNotifications,
        setUnreadNotications
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
