// src/components/Sidebar.js
import React, { useState } from 'react'; // Ajoutez cette ligne
import { Link } from 'react-router-dom';
import authService from '../services/authService';
import './sidebar.css';
import { useSocket } from "../context/SocketContext";
import { useLanguage } from "../context/LanguageContext";
import ParametersPage from './ParametersPage';

const Sidebar = ({ userId, activePage, onOpenParameters }) => {
    const { unreadNotifications, userRole } = useSocket();
    const { texts } = useLanguage();
    const [showParametersModal, setShowParametersModal] = useState(false);

    const handleLogout = () => {
        authService.logout();
    };

    const handleOpenParameters = () => {
        setShowParametersModal(true);
    };

    const handleCloseParameters = () => {
        setShowParametersModal(false);
    };

    return (
        <>
            <aside className="sidebar desktop-only">
                <div className="sidebar-header">
                    <Link to="/dashboard" className="logo-link">
                        <img src="/BreezyLogo.png" alt="Logo Breezy" className="logo-img"/>
                    </Link>
                </div>
                <ul className="sidebar-nav-links">
                    <li>
                        <Link to={"/dashboard"} className={`sidebar-nav-item ${activePage === 'home' ? 'active' : ''}`}>
                            <i className="fas fa-home"></i> <span>{texts.home || 'Accueil'}</span>
                        </Link>
                    </li>
                    <li>
                        <Link to={"/explorer"} className={`sidebar-nav-item ${activePage === 'explorer' ? 'active' : ''}`}>
                            <i className="fas fa-search"></i> <span>{texts.explore || 'Explorer'}</span>
                        </Link>
                    </li>
                    <li>
                        <Link to={'/notify'} className={`sidebar-nav-item ${activePage === 'notifications' ? 'active' : ''}`}>
                            <i className="fas fa-bell"></i>
                            <span className="notif-wrapper">
                                {texts.notifications || 'Notifications'}
                                {unreadNotifications > 0 && (
                                    <span className="notif-badge-2">{unreadNotifications}</span>
                                )}
                            </span>
                        </Link>
                    </li>
                    <li>
                        <Link to={`/messages`} className={`sidebar-nav-item ${activePage === 'messages' ? 'active' : ''}`}>
                            <i className="fas fa-envelope"></i> <span>{texts.messages || 'Messages'}</span>
                        </Link>
                    </li>
                    <li>
                        <Link to={`/profil/${userId}`}
                            className={`sidebar-nav-item ${activePage === 'profile' ? 'active' : ''}`}>
                            <i className="fas fa-user-circle"></i> <span>{texts.profile || 'Profil'}</span>
                        </Link>
                    </li>
                    <li>
                        <Link onClick={handleOpenParameters} 
                            className={`sidebar-nav-item ${activePage === 'settings' ? 'active' : ''}`}>
                            <i className="fas fa-cog"></i> <span>{texts.parameters || 'Paramètres'}</span>
                        </Link>
                    </li>
                    {userRole === 'admin' && (
                        <li>
                            <Link to={`/reporting`}
                                  className={`sidebar-nav-item ${activePage === 'reporting' ? 'active' : ''}`}>
                                <i className="fas fa-user-circle"></i> <span>{texts.reporting || 'Reporting'}</span>
                            </Link>
                        </li>
                    )}
                </ul>
                <button className="sidebar-logout-btn" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt"></i> <span>{texts.logout || 'Déconnexion'}</span>
                </button>
            </aside>
            {showParametersModal && (
                <ParametersPage handleCloseParameters={handleCloseParameters} />
            )}
        </>
    );
};

export default Sidebar;