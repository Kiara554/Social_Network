import React from 'react';
import './NotifyElement.css'; // You can reuse styles from Post.css or extend it
import { useLanguage } from '../context/LanguageContext';

const NotifyElement = ({ notifyType, notifyContent, createdAt, isRead }) => {
    const { texts } = useLanguage();

    const getIcon = () => {
        switch (notifyType) {
            case 'LIKE': return <i className="fas fa-heart" style={{ color: '#E0245E' }}></i>;
            case 'COMMENT': return <i className="fas fa-comment" style={{ color: '#1DA1F2' }}></i>;
            case 'SUBSCRIBE': return <i className="fas fa-user-plus" style={{ color: '#17BF63' }}></i>;
            case 'MESSAGE': return <i className="fas fa-message" style={{ color: '#B78D9A' }}></i>;
            default: return <i className="fas fa-bell" style={{ color: '#888' }}></i>;
        }
    };

    return (
        <div className={`post-card ${isRead ? '' : 'unread-notification'}`}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {getIcon()}
                <div className="post-content">
                    <div className="post-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {notifyContent}
                        {!isRead && (
                            <span className="new-label" style={{
                                backgroundColor: '#ff3b3b',
                                color: 'white',
                                fontSize: '0.75em',
                                fontWeight: 'bold',
                                padding: '2px 6px',
                                borderRadius: '4px'
                            }}>
                                {texts.newLabel}
                            </span>
                        )}
                    </div>
                    <div className="post-time" style={{ fontSize: '0.8em', color: '#666' }}>{createdAt}</div>
                </div>
            </div>
        </div>
    );
};

export default NotifyElement;
