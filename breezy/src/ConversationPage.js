import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from './context/SocketContext';
// import axios from 'axios';
import BottomBar from './components/bottombar';
import Sidebar from './components/sidebar';
import { getCurrentUserName } from './utils/utils';
import apiService from './services/apiService';

const ConversationPage = () => {
    const { id_conv } = useParams();
    const navigate = useNavigate();
    const {
        socket, userId, isConnected, sendPrivateMessage, connectedUsers,
        setUnreadMessagesCount
    } = useSocket();

    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [userNames, setUserNames] = useState({});
    const [profileImages, setProfileImages] = useState({});
    const [typingStatus, setTypingStatus] = useState({});
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const onResize = () => setIsMobileView(window.innerWidth <= 768);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const fetchConversation = async () => {
        try {
            const res = await apiService.gateway.get(`/messages/${id_conv}`);
            setMessages(res.data);

            const convRes = await apiService.gateway.get(`/conversations/${id_conv}`);
            setConversation(convRes.data);

            const allIds = convRes.data.participants;
            const names = { ...userNames };
            const images = { ...profileImages };

            for (const id of allIds) {
                if (!names[id]) {
                    try {
                        const res = await apiService.gateway.get(`/profile/${id}`);
                        names[id] = res.data?.username || `Inconnu ${id}`;
                        images[id] = res.data?.profileImage || '/user.svg';
                    } catch {
                        names[id] = `Inconnu ${id}`;
                        images[id] = '/user.svg';
                    }
                }
            }

            setUserNames(names);
            setProfileImages(images);

        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (userId && id_conv) {
            fetchConversation().then(() => {
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
                }, 100);
            });
        }
    }, [userId, id_conv]);

    useEffect(() => {
        if (!socket) return;

        const handleMessage = (message) => {
            if (message.conversationId === id_conv) {
                setMessages(prev => [...prev, message]);
            }
        };

        const handleTyping = ({ conversationId, userId: typingUserId, isTyping }) => {
            if (conversationId !== id_conv || String(typingUserId) === String(userId)) return;
            setTypingStatus(prev => ({
                ...prev,
                [conversationId]: {
                    ...prev[conversationId],
                    [typingUserId]: isTyping
                }
            }));
        };

        socket.on('private_message', handleMessage);
        socket.on('typing', handleTyping);

        return () => {
            socket.off('private_message', handleMessage);
            socket.off('typing', handleTyping);
        };
    }, [socket, id_conv, userId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setUnreadMessagesCount(0);
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const receiverId = conversation.participants.find(p => String(p) !== String(userId));
        const now = new Date();

        await apiService.gateway.post(`/messages`, {
            conversationId: id_conv,
            sender: userId,
            content: newMessage,
            timestamp: now
        });

        socket.emit('private_message', {
            content: newMessage,
            to: parseInt(receiverId),
            from: userId,
            conversationId: id_conv,
            timestamp: now,
        });

        const username = await getCurrentUserName();
        await apiService.gateway.post(`/notify`, {
            userId: receiverId,
            notifyType: 'MESSAGE',
            notifyContent: `Nouveau message de ${username} : ${newMessage} !`
        });

        const newMsg = {
            sender: userId,
            content: newMessage,
            timestamp: now,
        };
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');

        socket.emit('typing', {
            conversationId: id_conv,
            userId,
            isTyping: false
        });

        clearTimeout(typingTimeoutRef.current);

        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleTyping = (e) => {
        setNewMessage(e.target.value);

        if (!socket || !userId || !id_conv) return;

        socket.emit('typing', {
            conversationId: id_conv,
            userId,
            isTyping: true
        });

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing', {
                conversationId: id_conv,
                userId,
                isTyping: false
            });
        }, 2000);
    };

    const typingUsers = useCallback(() => {
        if (!typingStatus[id_conv]) return [];
        return Object.entries(typingStatus[id_conv])
            .filter(([id, typing]) => typing && String(id) !== String(userId))
            .map(([id]) => userNames[parseInt(id)]);
    }, [typingStatus, userNames, id_conv, userId]);

    if (isLoading) return <p>Chargement...</p>;

    return (
        <div className="messages-layout">
            <Sidebar userId={userId} activePage="messages" />
            <main className="messages-main-content">
                <div className="chat-window">
                    <header className="chat-header">
                        {isMobileView && (
                            <button className="back-button" onClick={() => navigate('/messages')}>
                                <i className="fas fa-arrow-left"></i>
                            </button>
                        )}
                        <img className="avatar" src={profileImages[parseInt(conversation.participants.find(p => String(p) !== String(userId)))]} alt="avatar" />
                        <h3>{userNames[parseInt(conversation.participants.find(p => String(p) !== String(userId)))]}</h3>
                        {typingUsers().length > 0 && (
                            <div className="typing-indicator">
                                <div className="typing-dots">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}
                    </header>
                    <div className="message-area">
                        {messages.map((msg, i) => {
                            console.log(msg);
                            const date = new Date(msg.createdAt || msg.timestamp);
                            const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            return (
                                <div key={i} className={`message-bubble ${parseInt(msg.sender) === userId ? 'sent' : 'received'}`}>
                                    <p>{msg.content}</p>
                                    <span className="message-time">{formattedTime}</span>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef}></div>
                    </div>
                    <form className="message-input-form" onSubmit={handleSendMessage}>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={handleTyping}
                            placeholder="Écrivez votre message..."
                        />
                        <button type="submit"><i className="fas fa-paper-plane"></i></button>
                    </form>
                </div>
            </main>
            {isMobileView && (
                <div className="mobile-only">
                    <BottomBar userId={userId} activePage="messages" />
                </div>
            )}
        </div>
    );
};

export default ConversationPage;
