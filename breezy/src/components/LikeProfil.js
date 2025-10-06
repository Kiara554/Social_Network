// src/components/LikeProfil.jsx
import React, { useEffect, useState } from 'react';
import apiService from '../services/apiService';
import { useSocket } from "../context/SocketContext";
import Post from './Post';
import { getNbLikesForBreez } from "../utils/likes";

const LikeProfil = ({ like, authorId, onUnlike }) => {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const { userId } = useSocket();

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const postRes = await apiService.gateway.get(`/getBreez/${like.breezId}`);
                const fetchedPost = postRes.data;

                const nbLikes = await getNbLikesForBreez(fetchedPost._id);

                const postWithLike = {
                    ...fetchedPost,
                    likes: nbLikes,
                    isLiked: true,
                };

                setPost(postWithLike);
                
                // Vérifier l'état d'abonnement
                if (userId && fetchedPost.authorId) {
                    try {
                        const subscriptionRes = await apiService.gateway.get(`/issubscribed/${userId}/${fetchedPost.authorId}`);
                        setIsSubscribed(subscriptionRes.data.isSubscribed);
                    } catch (err) {
                        console.error("Erreur lors de la vérification de l'abonnement :", err);
                        setIsSubscribed(false);
                    }
                }
            } catch (err) {
                console.error("Erreur lors du chargement du post liké :", err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [like.breezId, userId]);

    // Écouter les événements de mise à jour des abonnements
    useEffect(() => {
        const handleSubscriptionUpdate = (event) => {
            const { authorId, isSubscribed: newIsSubscribed } = event.detail;
            if (post && post.authorId === authorId) {
                setIsSubscribed(newIsSubscribed);
            }
        };

        window.addEventListener('subscriptionUpdate', handleSubscriptionUpdate);
        return () => {
            window.removeEventListener('subscriptionUpdate', handleSubscriptionUpdate);
        };
    }, [post]);

    if (loading) return <p>Chargement...</p>;
    if (error || !post) return <p>Erreur lors du chargement du post liké.</p>;

    return (
        <div className="liked-post-container">
            <Post
                postId={post._id}
                authorId={post.authorId}
                authorName={post.authorUserName}
                authorHandle={post.authorHandle}
                profilePic={post.profilePic}
                timeAgo={post.createdAt}
                textContent={post.textContent}
                imageUrl={post.imageUrl}
                comments={post.comments.length}
                retweets={post.retweets}
                likes={post.likes}
                isLiked={true}
                isSubscribed={isSubscribed}
                onUpdatePost={(postId, data) => {
                    if (data && data.isLiked === false && onUnlike) {
                        onUnlike();
                    }
                }}
            />
        </div>
    );
};

export default LikeProfil;
