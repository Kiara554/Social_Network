import React, { useState, useEffect } from 'react';
import { useSocket } from "../context/SocketContext";
import { useLanguage } from "../context/LanguageContext";
import { getCurrentUserName } from "../utils/utils";
import apiService from '../services/apiService';
import './FollowButton.css';

const FollowButton = ({ 
    authorId, 
    isSubscribed: initialIsSubscribed = false, 
    onUpdateAuthorSubscription,
    className = "",
    showIcon = true,
    subscribedText,
    unsubscribedText,
    disabled = false
}) => {
    const { socket, userId } = useSocket();
    const { texts } = useLanguage();
    const [isSubscribed, setIsSubscribed] = useState(initialIsSubscribed);
    const [isLoadingSubscribe, setIsLoadingSubscribe] = useState(false);

    // Mettre à jour l'état local quand les props changent
    useEffect(() => {
        setIsSubscribed(initialIsSubscribed);
    }, [initialIsSubscribed]);

    // Écouter les événements de mise à jour des abonnements
    useEffect(() => {
        const handleSubscriptionUpdate = (event) => {
            if (event.detail.authorId === authorId) {
                setIsSubscribed(event.detail.isSubscribed);
            }
        };

        window.addEventListener('subscriptionUpdate', handleSubscriptionUpdate);
        return () => {
            window.removeEventListener('subscriptionUpdate', handleSubscriptionUpdate);
        };
    }, [authorId]);

    const handleSubscribeClick = async (e) => {
        e.stopPropagation();

        if (isLoadingSubscribe || disabled) return;
        setIsLoadingSubscribe(true);

        // Ne pas permettre de s'abonner à soi-même
        if (userId === parseInt(authorId)) {
            setIsLoadingSubscribe(false);
            return;
        }

        // Optimistic update
        const newIsSubscribed = !isSubscribed;
        setIsSubscribed(newIsSubscribed);

        try {
            if (isSubscribed) {
                // Désabonnement
                await apiService.gateway.delete(`/unfollow/${userId}/${authorId}`);
            } else {
                // Abonnement
                await apiService.gateway.post('/follow', {
                    'authorId': userId,
                    'authorIdFollowed': authorId
                });

                // Créer une conversation
                await apiService.gateway.post('/conversations', {
                    'participants': [userId, authorId]
                });

                // Envoyer une notification
                const username = await getCurrentUserName();
                await apiService.gateway.post('/notify', {
                    "userId": authorId,
                    "notifyType": "SUBSCRIBE",
                    "notifyContent": `${username} ${texts.follow?.notification || "s'est abonné à toi !"}`,
                });

                // Émettre l'événement socket
                socket.emit('notify-subscribed', {
                    subscriberId: userId,
                    subscribingId: authorId,
                });
            }

            // Mettre à jour tous les posts du même auteur via le callback parent
            if (onUpdateAuthorSubscription) {
                onUpdateAuthorSubscription(authorId, newIsSubscribed);
            }

            // Dispatch event pour la compatibilité avec d'autres composants
            window.dispatchEvent(new CustomEvent('subscriptionUpdate', {
                detail: {
                    authorId,
                    isSubscribed: newIsSubscribed
                }
            }));

        } catch (error) {
            console.error("Error during subscription/unsubscription:", error);

            // Rollback en cas d'erreur
            setIsSubscribed(!newIsSubscribed);

        } finally {
            setIsLoadingSubscribe(false);
        }
    };

    // Ne pas afficher le bouton si c'est l'utilisateur lui-même
    if (userId === parseInt(authorId)) {
        return null;
    }

    return (
        <button 
            className={`follow-button ${isSubscribed ? 'subscribed' : ''} ${className}`}
            onClick={handleSubscribeClick}
            disabled={isLoadingSubscribe || disabled}
        >
            {showIcon && (
                <i className={`fas ${isSubscribed ? 'fa-check' : 'fa-user-plus'}`}></i>
            )}
            {isSubscribed 
                ? (subscribedText || texts.follow?.subscribed || "Abonné") 
                : (unsubscribedText || texts.follow?.unsubscribed || "S'abonner")}
        </button>
    );
};

export default FollowButton;