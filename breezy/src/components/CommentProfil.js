// src/components/CommentProfil.js
import React, { useEffect, useState } from 'react';
import apiService from '../services/apiService';
import Post from './Post';
import './CommentProfil.css';
import './Comment.css';
import { getNbLikesForBreez } from "../utils/likes";
import { useSocket } from "../context/SocketContext";

const CommentProfil = ({ commentId }) => {
    const [comment, setComment] = useState(null);
    const [post, setPost] = useState(null);
    const [likes, setLikes] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isliked, setIsLiked] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);

    const { userId } = useSocket(); // récupère l'utilisateur connecté

    useEffect(() => {
        const fetchCommentAndPost = async () => {
            try {
                // 1. Récupérer le commentaire
                const commentRes = await apiService.gateway.get(`/getcomment/${commentId}`);
                const commentData = commentRes.data;
                setComment(commentData);

                // 2. Récupérer le post parent
                const postRes = await apiService.gateway.get(`/getBreez/${commentData.breezId}`);
                const postData = postRes.data;
                setPost(postData);

                // 3. Récupérer le nombre de likes
                const nbLikes = await getNbLikesForBreez(postData._id);
                setLikes(nbLikes);

                // Vérifie si l'utilisateur a liké ce post
                const likedRes = await apiService.gateway.get(`/alreadylike/${userId}/${postData._id}`);
                setIsLiked(likedRes.data); // attend une réponse : { liked: true/false }
                
                // Vérifier l'état d'abonnement
                if (userId && postData.authorId) {
                    try {
                        const subscriptionRes = await apiService.gateway.get(`/issubscribed/${userId}/${postData.authorId}`);
                        setIsSubscribed(subscriptionRes.data.isSubscribed);
                    } catch (err) {
                        console.error("Erreur lors de la vérification de l'abonnement :", err);
                        setIsSubscribed(false);
                    }
                }
            } catch (err) {
                console.error("Erreur lors du chargement du commentaire ou du post parent :", err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchCommentAndPost();
    }, [commentId, userId]);

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
    if (error || !comment || !post) return <p>Erreur lors du chargement.</p>;

    return (
        <div className="comment-profil-block">
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
                likes={likes}
                isLiked={isliked}
                isSubscribed={isSubscribed}
            />
            <div className="user-comment-card">
                <p>{comment.textContent}</p>
            </div>
        </div>
    );
};

export default CommentProfil;
