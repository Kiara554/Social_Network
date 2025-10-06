import React, { useEffect, useState } from 'react';
import Sidebar from './components/sidebar';
import BottomBar from './components/bottombar';
import NotifyElement from './components/NotifyElement';
import { useSocket } from './context/SocketContext';
import { useLanguage } from './context/LanguageContext';
import { getCurrentUserId } from './utils/utils';
import './NotifyPage.css';
import apiService from './services/apiService';

const NotifyPage = () => {
    /** sockets & userId depuis le contexte */
    const { socket, userId, isConnected, setUnreadNotications } = useSocket();
    const { texts } = useLanguage();

    setUnreadNotications(0);

    /** état local */
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await apiService.gateway.get(`/notify/user/${userId}`);
                setNotifications(response.data);
                console.log("Notifications :", response.data);

                const mark = await apiService.gateway.put(`/notify/mark-read/${userId}`);
                console.log("Mark read :", mark.data);

            } catch (error) {
                console.error('Error fetching notifications:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNotifications();
    }, []);

    /* ------------------------------------ UI --------------------------------- */
    return (
        <div className="messages-layout">
            <Sidebar userId={userId} activePage="notifications" />

            {/* -------- Zone centrale -------- */}
            <main className="messages-main-content">
                <div className="chat-container">

                    {/* 100 % de la largeur : uniquement la liste des notifications */}
                    <div className="notification-list">
                        <header className="conversation-header">
                            <h2>{texts.notificationsTitle}</h2>
                        </header>

                        {isLoading ? (
                            <div className="loading-placeholder">
                                <div className="loading-spinner"></div>
                                <p>{texts.loadingNotifications}</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="no-notification">
                                <i className="fas fa-bell-slash"></i>
                                <p>{texts.noNotifications}</p>
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <NotifyElement
                                    key={notif._id}
                                    notifyType={notif.notifyType}
                                    notifyContent={notif.notifyContent}
                                    createdAt={notif.createdAt}
                                    isRead={notif.readValue}
                                />
                            ))
                        )}
                    </div>

                </div>
            </main>

            {/* ------- Barre inférieure mobile ------- */}
            <div className="mobile-only">
                <BottomBar userId={userId} activePage="notifications" />
            </div>
        </div>
    );
};

export default NotifyPage;
