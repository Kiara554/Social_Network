import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import { useNavigate } from 'react-router-dom';
import './FollowerCard.css';
import ProfileModal from './ProfileModal';
import { useLanguage } from '../context/LanguageContext';

// Composant FollowButton spécifique pour FollowerCard
const FollowerFollowButton = ({ authorId, isSubscribed, onUpdate, disabled = false, userId }) => {
    const { texts } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = async (e) => {
        e.stopPropagation();
        if (isLoading || disabled) return;

        try {
            setIsLoading(true);
            
            const newIsSubscribed = !isSubscribed;
            
            if (isSubscribed) {
                await apiService.gateway.delete(`/unfollow/${userId}/${authorId}`);
            } else {
                await apiService.gateway.post('/follow', {
                    'authorId': userId,
                    'authorIdFollowed': authorId
                });
            }
            
            // Mettre à jour le parent
            onUpdate(authorId, newIsSubscribed);
            
            // Déclencher l'événement global pour synchroniser tous les composants
            window.dispatchEvent(new CustomEvent('subscriptionUpdate', {
                detail: {
                    authorId,
                    isSubscribed: newIsSubscribed
                }
            }));
            
        } catch (error) {
            console.error("Erreur follow/unfollow :", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button 
            className={`follow-button ${isSubscribed ? 'subscribed' : ''} follower-follow-btn`}
            onClick={handleClick}
            disabled={isLoading || disabled}
        >
            <i className={`fas ${isSubscribed ? 'fa-check' : 'fa-user-plus'}`}></i>
            {isSubscribed 
                ? (texts.follow?.subscribed || "Abonné") 
                : (texts.follow?.unsubscribed || "S'abonner")}
        </button>
    );
};

const FollowerCard = ({ 
    user, 
    authorId, 
    isSubscribed,
    userId,
    onUpdateAuthorSubscription 
}) => {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isFollowLoading, setIsFollowLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const targetAuthorId = authorId || user?.authorId;
                
                if (!targetAuthorId || !userId) {
                    setLoading(false);
                    return;
                }

                const res = await apiService.gateway.get(`/profile/${targetAuthorId}`);
                setProfileData(res.data);
            } catch (error) {
                console.error("Erreur lors du chargement du profil :", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [authorId, user?.authorId, userId]);

    const handleSubscriptionUpdate = (authorId, newIsSubscribed) => {
        // Notifier le parent pour mettre à jour le state
        if (onUpdateAuthorSubscription) {
            onUpdateAuthorSubscription(authorId, newIsSubscribed);
        }
    };

    if (loading) {
        return (
            <div className="follower-card loading">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (!user || !profileData) {
        return null;
    }

    const targetAuthorId = authorId || user?.authorId;

    return (
        <div className="follower-card" onClick={() => setIsProfileModalOpen(true)}>
            <div className="follower-avatar">
                <img
                    src={profileData.profileImage || './user.svg'}
                    alt={`Avatar de ${profileData.username || user.authorUserName}`}
                    onError={(e) => { e.target.src = './user.svg'; }}
                />
            </div>
            <div className="follower-info">
                <h4 className="follower-name">{profileData.username || 'Utilisateur'}</h4>
                <p className="follower-handle">@{profileData.username || 'utilisateur'}</p>
                {profileData.bio && <p className="follower-bio">{profileData.bio}</p>}
            </div>
            <div className="follower-actions" onClick={(e) => e.stopPropagation()}>
                <FollowerFollowButton
                    authorId={targetAuthorId}
                    isSubscribed={isSubscribed}
                    onUpdate={handleSubscriptionUpdate}
                    disabled={isFollowLoading}
                    userId={userId}
                />
            </div>

            {isProfileModalOpen && (
                <ProfileModal
                    isOpen={isProfileModalOpen}
                    onClose={() => setIsProfileModalOpen(false)}
                    userId={targetAuthorId}
                />
            )}
        </div>
    );
};

export default FollowerCard;