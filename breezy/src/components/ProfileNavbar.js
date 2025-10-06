// src/components/ProfileNavbar.jsx

import React from 'react';
import './ProfileNavbar.css';

const ProfileNavbar = ({ activeTab, onTabChange }) => {
    return (
        <nav className="profile-navbar mobile-style">
            <button
                className={`bottom-nav-item ${activeTab === 'posts' ? 'active' : ''}`}
                onClick={() => onTabChange('posts')}
            >
                <i className="fas fa-sticky-note"></i>
                <span>Breez</span>
            </button>
            <button
                className={`bottom-nav-item ${activeTab === 'comments' ? 'active' : ''}`}
                onClick={() => onTabChange('comments')}
            >
                <i className="fas fa-comments"></i>
                <span>Commentaires</span>
            </button>
            <button
                className={`bottom-nav-item ${activeTab === 'likes' ? 'active' : ''}`}
                onClick={() => onTabChange('likes')}
            >
                <i className="fas fa-heart"></i>
                <span>Likes</span>
            </button>
            <button
                className={`bottom-nav-item ${activeTab === 'followers' ? 'active' : ''}`}
                onClick={() => onTabChange('followers')}
            >
                <i className="fas fa-user-friends"></i>
                <span>Followers</span>
            </button>
            <button
                className={`bottom-nav-item ${activeTab === 'follow' ? 'active' : ''}`}
                onClick={() => onTabChange('follow')}
            >
                <i className="fas fa-user-check"></i>
                <span>Follow</span>
            </button>
        </nav>
    );
};

export default ProfileNavbar;
