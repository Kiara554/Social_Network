// src/components/bottombar.js
import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import './bottombar.css';
import {useSocket} from '../context/SocketContext'; // 👈
import {useLanguage} from "../context/LanguageContext";
import ParametersPage from './ParametersPage';

const BottomBar = ({userId, activePage}) => {
    const [showParametersModal, setShowParametersModal] = useState(false);
    const {unreadNotifications, userRole} = useSocket();

    const {texts} = useLanguage();


    const handleOpenParameters = () => {
        setShowParametersModal(true);
    };
    const handleCloseParameters = () => {
        setShowParametersModal(false);
    };

    return (
        <>
            <div className="bottom-navbar">
                <Link to={"/dashboard"} className={`bottom-nav-item ${activePage === 'home' ? 'active' : ''}`}>
                    <i className="fas fa-home"></i>
                    <span>{texts.home}</span>
                </Link>
                {userRole !== 'admin' && (
                    <>
                    <Link to={'/explorer'} className={`bottom-nav-item ${activePage === 'explorer' ? 'active' : ''}`}>
                        <i className="fas fa-search"></i>
                        <span>{texts.explore}</span>
                    </Link>
                    <Link to={"/messages"} className={`bottom-nav-item ${activePage === 'messages' ? 'active' : ''}`}>
                        <i className="fas fa-envelope"></i>
                        <span>{texts.messages}</span>
                    </Link>
                    </>
                )}

                <Link to="/notify" className={`bottom-nav-item ${activePage === 'notifications' ? 'active' : ''}`}>
                    <div className="icon-wrapper">
                        <i className="fas fa-bell"></i>
                        {unreadNotifications > 0 && (
                            <span className="notif-badge">{unreadNotifications}</span>
                        )}
                    </div>
                    <span>{texts.notifications}</span>
                </Link>
                {userRole !== 'admin' && (
                    <Link to={`/profil/${userId}`}
                          className={`bottom-nav-item ${activePage === 'profile' ? 'active' : ''}`}>
                        <i className="fas fa-user-circle"></i>
                        <span>{texts.profile}</span>
                    </Link>
                )}
                <Link onClick={handleOpenParameters}
                      className={`bottom-nav-item ${activePage === 'settings' ? 'active' : ''}`}>
                    <i className="fas fa-cog"></i> <span>{texts.parameters}</span>
                </Link>
                {userRole === 'admin' && (
                    <Link to={`/reporting`}
                          className={`bottom-nav-item ${activePage === 'reporting' ? 'active' : ''}`}>
                        <i className="fas fa-user-circle"></i> <span>{texts.reporting || 'Reporting'}</span>
                    </Link>
                )

                }
            </div>
            {
                showParametersModal && (
                    <ParametersPage handleCloseParameters={handleCloseParameters}/>
                )
            }
        </>
    )
        ;
};

export default BottomBar;