        import { useEffect, useState } from "react";
import { useParams } from 'react-router-dom';
import './BreezPage.css';
import BottomBar from './components/bottombar';
import Comment from "./components/Comment";
import CommentModal from './components/CommentModal';
import Post from "./components/Post";
import Sidebar from './components/sidebar';
import { useSocket } from './context/SocketContext';
import apiService from './services/apiService';
import { getNbLikesForBreez } from "./utils/likes";
import { getCurrentUserName, getInfoUser } from "./utils/utils";

        const BreezPage = () => {
            const { breezId } = useParams();
            const [commentsList, setCommentsList] = useState([]);
            const [showCommentModal, setShowCommentModal] = useState(false);
            const [userName, setUserName] = useState(null);
            // const [userId, setUserId] = useState(getCurrentUserId());
            const [breez, setBreez] = useState([]);
            const [loading, setLoading] = useState(true);
            const [error, setError] = useState(null);
            const [likes, setLikes] = useState(0);
            const [isliked, setIsLiked] = useState(false);
            const [isSubscribed, setIsSubscribed] = useState(false); // Nouvel état pour l'abonnement
            const [replyToComment, setReplyToComment] = useState(null); // État pour gérer les réponses
            const [subscription, setSubscription] = useState({}); // { [authorId]: true/false }

            // const [userId, setUserId] = useState(''); // Placeholder, get this from auth context in real app
            const {userId,socket} = useSocket(); // Get userId from SocketContext

            const getBreez = async () => {
                try {
                    setLoading(true);
                    const response = await apiService.gateway.get(`/getBreez/${breezId}`);

                    setBreez([response.data]);

                    setCommentsList(response.data.comments);
                    
                    setLoading(false);

                } catch (err) {
                    console.error("Erreur lors du chargement du breez :", err);
                    setLoading(false);
                }
            };


            // Fonction pour vérifier si l'utilisateur est abonné à l'auteur du post
            const checkSubscriptionStatus = async (authorId) => {
                try {
                    const response = await apiService.gateway.get(`/issubscribed/${userId}/${authorId}`);
                    setIsSubscribed(response.data);
                } catch (err) {
                    console.error("Erreur lors de la vérification de l'abonnement :", err);
                    setIsSubscribed(false);
                }
            };

            const refreshComments = () => {
                getBreez().then(() => {
                    // Ajoute une classe highlight temporaire
                    document.querySelectorAll('.comment-card').forEach(card => {
                        card.classList.add('highlight');
                        setTimeout(() => card.classList.remove('highlight'), 1500);
                    });
                });
            };

            const handleReply = (commentId, authorName, onSuccess) => {
                setReplyToComment({ commentId, authorName });
                setShowCommentModal(true);
                // Passez le callback à CommentModal
            };
            
            // This function will now be called by the CommentModal's onSubmit
            const handleAddComment = async (commentText, mediaUrl, mediaType) => { // Takes only textContent now

                if (!commentText.trim()) {
                    alert("Le commentaire ne peut pas être vide.");
                    return;
                }

                try {

                    // Avec HttpOnly cookies, getInfoUser n'a plus besoin du token
                    const data = await getInfoUser();


                    if (data.userId && data.username) {
                        // setUserId(data.userId);
                        setUserName(data.username);

                        const commentData = {
                            "authorId": data.userId,
                            "authorUserName": data.username,
                            "breezId": breezId,
                            "textContent": commentText,
                            "mediaUrl": mediaUrl || null, // Optional media URL
                            "mediaType": mediaType || null // Optional media type
                        };

                        // Si c'est une réponse à un commentaire, ajouter l'idCommentResponse
                        if (replyToComment) {
                            commentData.idCommentResponse = replyToComment.commentId;
                        }

                        const response = await apiService.gateway.post('/addcomment', commentData);

                        if (response.data) {
                            if (replyToComment) {
                                // Si c'est une réponse, on recharge juste les commentaires pour voir les réponses imbriquées
                                getBreez();
                            } else {
                                // Si c'est un commentaire de premier niveau, on l'ajoute à la liste
                                setCommentsList([...commentsList, response.data.newComment._id]);
                                // Et on recharge pour être sûr d'avoir les dernières données
                                getBreez();
                            }
                            
                            setShowCommentModal(false); // Close the modal on successful submission
                            setReplyToComment(null); // Reset reply state

                            const username = await getCurrentUserName();
                            await apiService.gateway.post('/notify', {
                                "userId": data.userId,
                                "notifyType": "COMMENT",
                                "notifyContent": `${username} a commenté ton breeze !`,
                            })

                        } else {
                            alert("Erreur: Le commentaire n'a pas été renvoyé par le serveur.");
                            setShowCommentModal(false);
                            setReplyToComment(null);
                        }

                    } else {
                        // setUserId(null);
                        setUserName(null);
                    }

                } catch (err) {
                    console.error("Erreur lors de l'envoi du commentaire :", err);
                    alert("Erreur lors de l'ajout du commentaire.");
                }
            };
            const [subscriptions, setSubscriptions] = useState({}); // ex: { [authorId]: true }

            const handleFollowClick = async (authorId) => {
        if (subscriptions[authorId] === undefined) return;

        const newIsSubscribed = !subscriptions[authorId];
        setSubscriptions(prev => ({ ...prev, [authorId]: newIsSubscribed }));

        try {
            if (newIsSubscribed) {
            await apiService.gateway.post('/follow', {
                authorId: userId,
                authorIdFollowed: authorId
            });

            await apiService.gateway.post('/conversations', {
                participants: [userId, authorId]
            });

            const username = await getCurrentUserName();
            await apiService.gateway.post('/notify', {
                userId: authorId,
                notifyType: "SUBSCRIBE",
                notifyContent: `${username} s'est abonné à toi !`
            });

            socket.emit("notify-subscribed", {
                subscriberId: userId,
                subscribingId: authorId
            });

            } else {
            await apiService.gateway.delete(`/unfollow/${userId}/${authorId}`);
            }

            // Propagation
            window.dispatchEvent(new CustomEvent("subscriptionUpdate", {
            detail: { authorId, isSubscribed: newIsSubscribed }
            }));

        } catch (err) {
            console.error("Erreur (abonnement/désabonnement) :", err);
            // rollback
            setSubscriptions(prev => ({ ...prev, [authorId]: !newIsSubscribed }));
        }
        };


            useEffect(() => {
                getBreez();
                if (userId) { // Ne lancer getLikes que si userId est disponible
                    getLikes(userId); // Passez le userId actuel
                }
            }, [breezId, userId]);

            // Vérifier l'état du like quand la page se charge
            useEffect(() => {
                if (breezId && userId) {
                    const checkLikeStatus = async () => {
                        try {
                            const likedRes = await apiService.gateway.get(`/alreadylike/${userId}/${breezId}`);
                            console.log("BreezPage - Vérification like au montage:", { userId, breezId, isLiked: likedRes.data });
                            setIsLiked(likedRes.data);
                        } catch (err) {
                            console.error("Erreur lors de la vérification du like au montage :", err);
                        }
                    };
                    checkLikeStatus();
                }
            }, [breezId, userId]);

            const getLikes = async (currentUserId) => { // Prenez userId en paramètre
                try {
                    if (!userId) return; // Ne rien faire si userId est vide
                    
                    const nbLikes = await getNbLikesForBreez(breezId);
                    setLikes(nbLikes);

                    const likedRes = await apiService.gateway.get(`/alreadylike/${currentUserId}/${breezId}`);
                    console.log("BreezPage - Vérification like:", { userId: currentUserId, breezId, isLiked: likedRes.data });
                    setIsLiked(likedRes.data);
                } catch (err) {
                    console.error("Erreur lors de la récupération des likes :", err);
                }
            };

            // Effet pour vérifier l'abonnement quand le breez et l'userId sont disponibles
        useEffect(() => {
  if (breez.length > 0 && userId) {
    const fetchSubscriptions = async () => {
      try {
        // Vérifier l'abonnement spécifiquement pour l'auteur du post
        const authorId = breez[0].authorId;
        const res = await apiService.gateway.get(`/issubscribed/${userId}/${authorId}`);
        setSubscriptions(prev => ({
          ...prev,
          [authorId]: res.data.isSubscribed
        }));
      } catch (e) {
        console.error("Erreur chargement abonnements :", e);
        // En cas d'erreur, supposer que l'utilisateur n'est pas abonné
        const authorId = breez[0].authorId;
        setSubscriptions(prev => ({
          ...prev,
          [authorId]: false
        }));
      }
    };
    fetchSubscriptions();
  }
}, [breez, userId]);

const handleUpdateAuthorSubscription = (authorId, newIsSubscribed) => {
  setSubscriptions(prev => ({
    ...prev,
    [authorId]: newIsSubscribed
  }));
};

useEffect(() => {
  const handleSubscriptionUpdate = (e) => {
    const { authorId, isSubscribed } = e.detail;
    setSubscriptions(prev => ({
      ...prev,
      [authorId]: isSubscribed
    }));
  };

  window.addEventListener("subscriptionUpdate", handleSubscriptionUpdate);

  return () => {
    window.removeEventListener("subscriptionUpdate", handleSubscriptionUpdate);
  };
}, []);

// Synchroniser les likes quand ils changent ailleurs
useEffect(() => {
  console.log("BreezPage - Installation écouteur likeUpdate pour breezId:", breezId);
  
  const handleLikeUpdate = (e) => {
    const { postId, isLiked } = e.detail;
    console.log("BreezPage - Événement likeUpdate reçu:", { postId, breezId, isLiked });
    if (postId === breezId) {
      console.log("BreezPage - Mise à jour isLiked:", isLiked);
      setIsLiked(isLiked);
    }
  };

  window.addEventListener("likeUpdate", handleLikeUpdate);
  return () => {
    console.log("BreezPage - Suppression écouteur likeUpdate pour breezId:", breezId);
    window.removeEventListener("likeUpdate", handleLikeUpdate);
  };
}, [breezId]);

            return (
                <div className="dashboard-layout">
                    <Sidebar userId={userId} activePage="home" />
                    

                    <main className="main-content-area">
                        <header className="main-header desktop-only">
                            <h1 className="header-title">Breez</h1>
                        </header>

                        <section className="feed-section">

                            {breez.map(post => (
                                <Post
                                    key={post._id} // Important pour React lors du rendu de listes
                                    postId={post._id}
                                    authorId={post.authorId}
                                    authorName={post.authorUserName}
                                    authorHandle={post.authorHandle}
                                    profilePic="{post.profilePic}"
                                    timeAgo={post.createdAt} // Assuming post.createdAt is a date string
                                    textContent={post.textContent}
                                    mediaUrl={post.mediaUrl}
                                    mediaType={post.mediaType}
                                    comments={post.comments.length}
                                    retweets={post.retweets}
                                    likes={likes}  
                                    isLiked={isliked} // Assuming this is part of the post data
                                    isSubscribed={subscriptions[post.authorId] || false}
                                    onUpdateAuthorSubscription={handleUpdateAuthorSubscription}
                                    onFollowToggle={() => handleFollowClick(post.authorId)}
                                    onClickPost={() => {}}
                                    onUpdatePost={(postId, data) => {
                                        if (data && typeof data.likes === 'number') {
                                            setLikes(data.likes);
                                            setIsLiked(data.isLiked);
                                        }
                                    }}
                                />
                            ))}


                            {/* Button to open the comment modal */}
                            <div style={{ textAlign: 'center', margin: '20px 0' }}>
                                <button
                                    onClick={() => setShowCommentModal(true)} // Open the modal
                                    className="add-comment-toggle-button"
                                >
                                    Ajouter un commentaire
                                </button>
                            </div>


                            {/* Section for Comments */}
                            <div className="comments-section">
                                <h2>Commentaires</h2>
                                {commentsList.length > 0 ? (
                                    commentsList.map(commentId => (
                                        <Comment
                                            key={commentId} // Each comment needs a unique key
                                            commentId={commentId}
                                            breezId={breezId}
                                            onReply={handleReply}
                                        />
                                    ))
                                ) : (
                                    <p>Aucun commentaire pour l'instant.</p>
                                )}
                            </div>

                        </section>
                    </main>
                    {/* Barre de navigation inférieure (Mobile Only) */}
                    <nav className="bottom-navbar mobile-only">
                        <BottomBar userId={userId} activePage="home" />
                    </nav>

                    {/* Comment Modal */}
                    <CommentModal
                        isOpen={showCommentModal}
                        onClose={() => {
                            setShowCommentModal(false);
                            setReplyToComment(null);
                        }}
                        onSubmit={(text, mediaUrl, mediaType) => {
                            handleAddComment(text, mediaUrl, mediaType).then(() => {
                                refreshComments(); // Rafraîchit après soumission
                            });
                        }}
                        replyToComment={replyToComment}
                    />

                </div>
            );
        };

        export default BreezPage; 

