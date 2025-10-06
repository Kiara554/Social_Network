import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useLanguage } from "../context/LanguageContext";
import { useSocket } from "../context/SocketContext";
import { deletePostAndRelated } from '../utils/breez';
import { getTimeAgo } from '../utils/time';
import { getCurrentUserName } from "../utils/utils";
import FollowButton from './FollowButton';
import './Post.css';
import ProfileModal from './ProfileModal';
import UpdateBreez from './updateBreez';
import apiService from '../services/apiService';

const Post = ({
    postId,
    authorId,
    authorName,
    timeAgo,
    textContent,
    mediaUrl,
    mediaType,
    comments,
    retweets,
    likes: initialLikes,
    isLiked: initialIsLiked,
    isSubscribed: initialIsSubscribed,
    onUpdatePost,
    onUpdateAuthorSubscription,
    showControls = false,
    showControlsReport = true,
}) => {
    const { socket, userId, userRole } = useSocket();
    const { texts } = useLanguage();
    const currentlikes = initialLikes || 0;
    const isliked = initialIsLiked || false;
    const [isLoadingLike, setIsLoadingLike] = useState(false);
    const [animateLike, setAnimateLike] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [profileImageUrl, setProfileImageUrl] = useState(null);
    const [timeAgoDisplay, setTimeAgoDisplay] = useState(getTimeAgo(timeAgo));
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(initialIsSubscribed || false);
    const navigate = useNavigate();

    useEffect(() => {
        setIsSubscribed(initialIsSubscribed || false);
    }, [initialIsSubscribed]);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeAgoDisplay(getTimeAgo(timeAgo));
        }, 60000);
        setTimeAgoDisplay(getTimeAgo(timeAgo));
        return () => clearInterval(interval);
    }, [timeAgo]);

    useEffect(() => {
        const fetchProfileImage = async () => {
            try {
                const res = await apiService.gateway.get(`/profile/${authorId}`);
                setProfileImageUrl(res.data.profileImage || "./user.svg");
            } catch (error) {
                setProfileImageUrl("./user.svg");
            }
        };
        fetchProfileImage();
    }, [authorId]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.post-menu-container')) {
                setShowMenu(false);
            }
        };
        if (showMenu) {
            document.addEventListener('click', handleClickOutside);
        }
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [showMenu]);

    // Écouter les événements de mise à jour des abonnements
    useEffect(() => {
        const handleSubscriptionUpdate = (event) => {
            const { authorId: updatedAuthorId, isSubscribed: newIsSubscribed } = event.detail;
            if (updatedAuthorId === authorId) {
                setIsSubscribed(newIsSubscribed);
            }
        };

        window.addEventListener('subscriptionUpdate', handleSubscriptionUpdate);
        return () => {
            window.removeEventListener('subscriptionUpdate', handleSubscriptionUpdate);
        };
    }, [authorId]);

    const handleProfileClick = (e) => {
        e.stopPropagation();
        setIsProfileModalOpen(true);
    };

    const handleMenuButtonClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setShowMenu(!showMenu);
    };

    const handleMenuItemClick = (e, action) => {
        e.stopPropagation();
        e.preventDefault();
        setShowMenu(false);
        action();
    };

    const handleLikeClick = async (e) => {
        e.stopPropagation();
        if (isLoadingLike) return;
        setIsLoadingLike(true);
        const newIsLiked = !isliked;
        const newLikesCount = newIsLiked ? currentlikes + 1 : currentlikes - 1;

        if (newIsLiked) {
            setAnimateLike(true);
            setTimeout(() => setAnimateLike(false), 500);
        }

        try {
            if (isliked) {
                await apiService.gateway.delete(`/deletelike/${userId}/${postId}`);
            } else {
                await apiService.gateway.post('/addlike', {
                    'authorId': userId,
                    'breezId': postId
                });
                socket.emit('notify-liked', {
                    postId: postId,
                    likerId: userId,
                    postAuthorId: authorId,
                });
                const username = await getCurrentUserName();
                await apiService.gateway.post('/notify', {
                    "userId": authorId,
                    "notifyType": "LIKE",
                    "notifyContent": `${username} a liké ton post !`,
                });
            }
            if (onUpdatePost) {
                onUpdatePost(postId, {
                    likes: newLikesCount,
                    isLiked: newIsLiked
                });
            }
            
            // Synchroniser avec les autres composants
            window.dispatchEvent(new CustomEvent('likeUpdate', {
                detail: { postId, isLiked: newIsLiked }
            }));
            console.log("Post - Événement likeUpdate envoyé:", { postId, isLiked: newIsLiked });
        } catch (error) {
            console.error("Erreur lors de la gestion du like :", error);
            if (onUpdatePost) {
                onUpdatePost(postId, {
                    likes: currentlikes,
                    isLiked: !newIsLiked
                });
            }
            setAnimateLike(false);
        } finally {
            setIsLoadingLike(false);
        }
    };

    const handleDeletePost = async (e) => {
        e.stopPropagation();
        const result = await deletePostAndRelated(postId);
        if (result.success) {
            if (onUpdatePost) {
                onUpdatePost(postId, null);
            }
        } else {
            console.error("Erreur : ", result.error);
        }
    };

    const handleReportPost = async (e) => {
        e.stopPropagation();
        try {
            await apiService.gateway.post('/reportuser', {
                "reporterId": userId,
                "reportedPostId": postId,
                "reportedUserId": "",
            });
            toast.success(texts.postReportSuccess || "Post signalé avec succès !");
            if (onUpdatePost) {
                onUpdatePost(postId, null);
            }
        } catch (error) {
            console.error("Erreur lors du signalement du post :", error);
            toast.error(texts.postReportError || "Erreur lors du signalement du post !");
        }
    };

    const handleReportUser = async (e) => {
        e.stopPropagation();
        try {
            await apiService.gateway.post('/reportuser', {
                "reporterId": userId,
                "reportedUserId": authorId,
                "reportedPostId": "",
            });
            toast.success(texts.userReportSuccess || "Utilisateur signalé avec succès !");
            if (onUpdatePost) {
                onUpdatePost(postId, null);
            }
        } catch (error) {
            console.error("Erreur lors du signalement de l'utilisateur :", error);
            toast.error(texts.userReportError || "Erreur lors du signalement de l'utilisateur !");
        }
    };

    const handleCardClick = (e) => {
        if (["BUTTON", "INPUT", "TEXTAREA", "LABEL"].includes(e.target.tagName)) return;
        navigate(`/breez/${postId}`);
    };

    if (!profileImageUrl) return null;

    return (
        <div className="post-card" onClick={handleCardClick}>
            <img 
                src={profileImageUrl} 
                alt={`${authorName}'s profile`} 
                className="post-avatar" 
                onClick={handleProfileClick}
            />
            <div className="post-content">
                <div className="post-header">
                    <span 
                        className="post-author-name"
                        onClick={handleProfileClick}
                        style={{ cursor: 'pointer' }}
                    >
                        {authorName}
                    </span>
                    <span className="post-time"> <strong>•</strong> {timeAgoDisplay}</span>
                    
                    {(!showControls) && (
                        <FollowButton
                            authorId={authorId}
                            isSubscribed={isSubscribed}
                            onUpdateAuthorSubscription={onUpdateAuthorSubscription}
                            className="post-subscribe-btn"
                        />
                    )}
                    
                    {showControls && userRole === "user" && (
                        <div className="post-menu-container">
                            <button
                                className="post-menu-button"
                                onClick={handleMenuButtonClick}
                            >
                                <i className="fas fa-ellipsis-h"></i>
                            </button>
                            {showMenu && (
                                <div className="post-menu-dropdown" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        className="post-menu-item"
                                        onClick={(e) => handleMenuItemClick(e, () => setIsEditModalOpen(true))}
                                        title={texts.edit}
                                    >
                                        <i className="fas fa-pen"></i>
                                    </button>
                                    <button 
                                        className="post-menu-item" 
                                        onClick={(e) => handleMenuItemClick(e, () => handleDeletePost(e))}
                                        title={texts.delete}
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {userRole === "user" && showControlsReport && (
                        <div className="post-menu-container">
                            <button
                                className="post-menu-button"
                                onClick={handleMenuButtonClick}
                            >
                                <i className="fas fa-ellipsis-h"></i>
                            </button>
                            {showMenu && (
                                <div className="post-menu-dropdown" onClick={(e) => e.stopPropagation()}>
                                    <button 
                                        className="post-menu-item" 
                                        onClick={(e) => handleMenuItemClick(e, () => handleReportUser(e))}
                                        title={texts.reportUser}
                                    >
                                        <i className="fa-solid fa-user-slash"></i>
                                    </button>
                                    <button 
                                        className="post-menu-item" 
                                        onClick={(e) => handleMenuItemClick(e, () => handleReportPost(e))}
                                        title={texts.reportPost}
                                    >
                                        <i className="fa-solid fa-comment-slash"></i>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <p className="post-text">{textContent}</p>

                {mediaUrl && (
                    <>
                        <div className="post-media-container" onClick={(e) => {
                            e.stopPropagation();
                            setIsZoomed(true);
                        }}>
                            {mediaType === 'video' ? (
                                <video className="post-media" src={mediaUrl} muted/>
                            ) : (
                                <img className="post-media" src={mediaUrl} alt="media"/>
                            )}
                        </div>

                        {isZoomed && (
                            <div className="media-overlay" onClick={() => setIsZoomed(false)}>
                                <button className="media-close-btn" onClick={(e) => {
                                    e.stopPropagation();
                                    setIsZoomed(false);
                                }}>
                                    &times;
                                </button>
                                <div className="media-popup" onClick={(e) => e.stopPropagation()}>
                                    {mediaType === 'video' ? (
                                        <video src={mediaUrl} controls autoPlay className="media-full"/>
                                    ) : (
                                        <img src={mediaUrl} alt="media" className="media-full"/>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
                
                {isEditModalOpen && (
                    <UpdateBreez
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        onUpdate={(updatedText) => {
                            setIsEditModalOpen(false);
                            if (onUpdatePost) {
                                onUpdatePost(postId, { textContent: updatedText });
                            }
                        }}
                        postId={postId}
                        currentText={textContent}
                        mediaUrl={mediaUrl}
                        mediaType={mediaType}
                    />
                )}

                <div className="post-actions">
                    <button className="post-action-btn" title={texts.comments}>
                        <i className="far fa-comment"></i>
                        <span>{comments}</span>
                    </button>
                    <button className="post-action-btn" onClick={handleLikeClick} disabled={isLoadingLike} title={texts.likes}>
                        <i className={`${isliked ? "fas fa-heart liked" : "far fa-heart"} ${isliked && animateLike ? "liked-animation" : ""}`}></i>
                        <span>{currentlikes}</span>
                    </button>
                </div>
            </div>

            {isProfileModalOpen && (
                <ProfileModal 
                    isOpen={isProfileModalOpen}
                    onClose={() => setIsProfileModalOpen(false)}
                    userId={authorId}
                />
            )}
        </div>
    );
};

export default Post;