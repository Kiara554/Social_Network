import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './components/sidebar';
import apiService from './services/apiService';
import { useSocket } from './context/SocketContext';
import BottomBar from "./components/bottombar";
import './ConversationsListPage.css';

const ConversationsListPage = () => {
    const { userId, connectedUsers } = useSocket();
    const [conversations, setConversations] = useState([]);
    const [userNames, setUserNames] = useState({});
    const [profileImages, setProfileImages] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const res = await apiService.gateway.get(`/conversations/user/${userId}`);
                console.log(res.data);
                setConversations(res.data);
                const allIds = new Set();
                res.data.forEach(conv => conv.participants.forEach(p => allIds.add(p)));
                await fetchUserNames(Array.from(allIds));
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };

        const fetchUserNames = async (ids) => {
            const names = { ...userNames };
            const images = { ...profileImages };
            for (const id of ids) {
                if (!names[id]) {
                    try {
                        // const res = await axios.get(`${process.env.REACT_APP_URL_API_GATEWAY}/profilestats/${id}`);
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
        };

        if (userId) {
            fetchConversations();
        }
    }, [userId]);

    return (
        <div className="messages-layout">
            <Sidebar userId={userId} activePage="messages" />
            <main className="messages-main-content">
                <div className="conversation-list">
                    <header className="conversation-header">
                        <h2>Discussions</h2>
                    </header>
                    {isLoading ? (
                        <p>Chargement...</p>
                    ) : (
                        <ul>
                            {conversations.map(conv => {
                                const otherId = conv.participants.find(p => String(p) !== String(userId));
                                const isConnected = connectedUsers.includes(String(otherId));
                                return (
                                    <li
                                        key={conv._id}
                                        className="conversation-item"
                                        onClick={() => navigate(`/messages/${conv._id}`)}
                                    >
                                        <div className={`status-circle ${isConnected ? 'green' : 'red'}`}></div>
                                        {/*<i className='avatar fas fa-user-circle'></i>*/}
                                        <img className="avatar" src={profileImages[parseInt(otherId)]} alt="avatar"/>
                                        <div className="conversation-details">
                                            <span className="conversation-name">{userNames[parseInt(otherId)]}</span>
                                            <p className="conversation-preview">{conv.messages?.[0]?.content || 'Démarrez la conversation'}</p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </main>

            {/* Barre de navigation inférieure (Mobile Only) */}
            <nav className="bottom-navbar mobile-only">
                <BottomBar userId={userId} activePage="messages" />
            </nav>

        </div>
    );
};

export default ConversationsListPage;
