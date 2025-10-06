// src/components/Comment.js
import React, {useEffect, useState} from 'react';
import './Comment.css';
import { getTimeAgo } from '../utils/time';
import apiService from '../services/apiService';

const Comment = ({ commentId, breezId, onReply, depth=0, refreshComments}) => {
    const [authorName, setAuthorName] = useState('Qaw');
    const [timeAgo, setTimeAgo] = useState('1 minute ago');
    const [profilePic, setProfilePic] = useState(null);
    const [textContent, setTextContent] = useState('asqasssdds');
    const [mediaUrl, setMediaUrl] = useState(null);
    const [mediaType, setMediaType] = useState(null);
    const [authorId, setAuthorId] = useState(null);
    const [timeAgoDisplay, setTimeAgoDisplay] = useState(getTimeAgo(timeAgo));
    const [replies, setReplies] = useState([]);
    const [showReplies, setShowReplies] = useState(false);

    const MAX_DEPTH = 3;
    const isNested = depth > 0;

    const getCommentInfo = async () => {
        const response = await apiService.gateway.get(`/getcomment/${commentId}`);
        console.log("Response data:", response.data);

        if (response.data && response.status === 200) {
            setTextContent(response.data.textContent);
            setAuthorName(response.data.authorUserName);
            setAuthorId(response.data.authorId);
            setMediaUrl(response.data.mediaUrl || null );
            setMediaType(response.data.mediaType || null );
            setTimeAgo(response.data.createdAt || '1 minute ago');
            
            if (response.data.replies && response.data.replies.length > 0) {
                setReplies(response.data.replies);
            }
        } else {
            console.log("Pas de commentaire trouvé !")
        }
    }
    
    const fetchProfileImage = async () => {
        try {
            const res = await apiService.gateway.get(`/profile/${authorId}`);
            setProfilePic(res.data.profileImage || "./user.svg");
        } catch (error) {
            setProfilePic("./user.svg");
        }
    };

    const handleReply = () => {
        if (onReply) {
            onReply(commentId, authorName, () => {
                refreshComments();
            });
        }
    };

    useEffect(() => {
        getCommentInfo();
        if (authorId) {
        fetchProfileImage();}
    }, [commentId, authorId]);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeAgoDisplay(getTimeAgo(timeAgo));
        }, 60000);

        setTimeAgoDisplay(getTimeAgo(timeAgo));

        return () => clearInterval(interval);
    }, [timeAgo]);

    return (
        <div className={`comment-card ${isNested ? 'nested' : ''}`} data-depth={depth}>
            <img src={profilePic} alt={`${authorName}'s profile`} className="comment-avatar" />
            
            <div className="comment-content">
                <div className="comment-header">
                    <span className="comment-author-name">{authorName}</span>
                    <span className="comment-time"> • {timeAgoDisplay}</span>
                </div>
                
                <p className="comment-text">{textContent}</p>
                
                {mediaUrl && (
                    <div className="comment-media-container">
                        {mediaType === 'video' ? (
                            <video src={mediaUrl} controls className="comment-media" />
                        ) : (
                            <img src={mediaUrl} alt="Media" className="comment-media" />
                        )}
                    </div>
                )}
                
                <div className="comment-actions">
                    <button className="reply-bubble" onClick={handleReply}>
                        <i className="fas fa-reply reply-icon"></i>
                        <span>Répondre</span>
                    </button>
                </div>

                {replies.length > 0 && (
                    <div className={`comment-replies ${depth >= MAX_DEPTH ? 'no-indent' : ''}`}>
                        <button 
                            className="show-replies-btn"
                            onClick={() => setShowReplies(!showReplies)}
                        >
                            {showReplies ? (
                                <>
                                    <i className="fas fa-chevron-up reply-icon"></i>
                                    <span>Masquer les réponses</span>
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-chevron-down reply-icon"></i>
                                    <span>{replies.length} réponse{replies.length > 1 ? 's' : ''}</span>
                                </>
                            )}
                        </button>
                        
                        {showReplies && (
                            <div className="replies-list">
                                {replies.map((reply) => (
                                    <Comment 
                                        key={reply._id}
                                        commentId={reply._id}
                                        breezId={breezId}
                                        onReply={onReply}
                                        depth={depth + 1}
                                        refreshComments={refreshComments}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Comment;