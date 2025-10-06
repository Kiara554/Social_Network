import apiService from './services/apiService';
import Cookies from 'js-cookie';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import CommentProfil from './components/CommentProfil';
import FollowerCard from './components/FollowerCard';
import LikeProfil from './components/LikeProfil';
import Post from './components/Post';
import './DashboardPage.css';
import authService from './services/authService';
import { getCurrentUserId, getCurrentUserName } from './utils/utils';
import { getNbLikesForBreez } from './utils/likes';
import { useLanguage } from './context/LanguageContext';

import BottomBar from './components/bottombar';
import ProfileHeader from './components/ProfileHeader';
import ProfileNavbar from './components/ProfileNavbar';
import Sidebar from './components/sidebar';
 
 
const UserPage = () => {
    const [userName, setUserName] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const [enrichedUserPosts, setEnrichedUserPosts] = useState([]);
    const [userComments, setUserComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userId, setUserId] = useState(null);
    const [activeTab, setActiveTab] = useState('posts');
    const [likedPosts, setLikedPosts] = useState([]);
    const [enrichedLikedPosts, setEnrichedLikedPosts] = useState([]);
    const [followers, setFollowers] = useState([]);
    const [follow, setFollow] = useState([]);
    const location = useLocation();
    const { texts } = useLanguage();
    
 
 
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Avec HttpOnly cookies, plus besoin de lire le token manuellement
                const id = await getCurrentUserId();
                const name = getCurrentUserName();
 
                setUserId(id);
                setUserName(name);
 
                // Récupération des posts de l'utilisateur
                // 1. Récupérer les posts de l'utilisateur
                const postRes = await apiService.gateway.get(`/getalluserbreez/${id}`);
                const posts = postRes.data;

                // 2. Pour chaque post, récupérer likes et si user a liké
                const postsWithLikesAndIsLiked = await Promise.all(posts.map(async (post) => {
                  const likesCount = await getNbLikesForBreez(post._id);
                
                  const likedRes = await apiService.gateway.get(`/alreadylike/${id}/${post._id}`);
                  const isLiked = likedRes.data;
                
                  return {
                    ...post,
                    likes: likesCount,
                    isLiked,
                  };
                }));
            
                setUserPosts(postsWithLikesAndIsLiked);
 
                // Récupération des commentaires de l'utilisateur
                const commentRes = await apiService.gateway.get(`/getallusercomment/${id}`);
                setUserComments(commentRes.data);
 
                // Récupération des posts likés
                const likedRes = await apiService.gateway.get(`/getalluserlike/${id}`);
                setLikedPosts(likedRes.data);
                
                // Enrichir les posts avec l'état d'abonnement
                const enrichedPosts = await enrichPostsWithSubscriptions(postsWithLikesAndIsLiked, id);
                setEnrichedUserPosts(enrichedPosts);
                
                const enrichedLiked = await enrichPostsWithSubscriptions(likedRes.data, id);
                setEnrichedLikedPosts(enrichedLiked);
 
                // Récupération des followers
                const followersRes = await apiService.gateway.get(`/followers/${id}`);
                setFollowers(followersRes.data);
               
                // Récupération des follow
                const followRes = await apiService.gateway.get(`/following/${id}`);
                setFollow(followRes.data);
 
 
                setLoading(false);
            } catch (err) {
                setError(err);
                setLoading(false);
                console.error(`${texts.profileLoadError}`, err);
            }
        };
 
        fetchUserData();
    }, []);

    // Fonction pour enrichir les posts avec l'état d'abonnement
    const enrichPostsWithSubscriptions = async (posts, currentUserId) => {
        if (!posts.length || !currentUserId) return posts;

        try {
            // Récupérer tous les auteurs uniques
            const authorIds = [...new Set(posts.map(post => post.authorId))];
            
            // Vérifier tous les abonnements en une fois
            const subscriptionPromises = authorIds.map(authorId =>
                apiService.gateway.get(`/issubscribed/${currentUserId}/${authorId}`)
                    .then(res => ({ authorId, isSubscribed: res.data.isSubscribed }))
                    .catch(err => ({ authorId, isSubscribed: false, error: err }))
            );

            const subscriptionResults = await Promise.all(subscriptionPromises);
            const subscriptionMap = new Map(subscriptionResults.map(item => [item.authorId, item.isSubscribed]));

            // Enrichir les posts avec les états d'abonnement
            return posts.map(post => ({
                ...post,
                isSubscribed: subscriptionMap.get(post.authorId) || false
            }));

        } catch (err) {
            console.error("Erreur lors de l'enrichissement des posts :", err);
            return posts.map(post => ({ ...post, isSubscribed: false }));
        }
    };

    // Fonction pour recharger les données d'abonnement
    const reloadFollowData = async () => {
        if (!userId) return;
        
        try {
            const [followersRes, followRes] = await Promise.all([
                apiService.gateway.get(`/followers/${userId}`),
                apiService.gateway.get(`/following/${userId}`)
            ]);
            
            setFollowers(followersRes.data);
            setFollow(followRes.data);
        } catch (err) {
            console.error("Erreur lors du rechargement des abonnements :", err);
        }
    };

    // Écouter les événements de mise à jour des abonnements
    useEffect(() => {
        const handleSubscriptionUpdate = async (event) => {
            const { authorId, isSubscribed } = event.detail;
            
            // Recharger les listes followers et follow
            if (userId) {
                await reloadFollowData();
            }
        };

        window.addEventListener('subscriptionUpdate', handleSubscriptionUpdate);
        return () => {
            window.removeEventListener('subscriptionUpdate', handleSubscriptionUpdate);
        };
    }, [userId]);
 
    const handleLogout = () => {
        authService.logout();
    };
 
    return (
        <div className="dashboard-layout">
           
            <Sidebar userId={userId} activePage="profile" />
 
            <main className="main-content-area">
                <header className="main-header">
                    <ProfileHeader/>
                </header>
               
               
 
                {/*  Navbar de navigation entre Posts / Commentaires */}
                <ProfileNavbar activeTab={activeTab} onTabChange={setActiveTab}/>  
 
                {/*  Affichage conditionnel selon l'onglet actif */}
                {activeTab === 'posts' && (
                    <section className="feed-section">
                        <h2>{texts.myPosts}</h2>
                        {loading && <p>{texts.loading}</p>}
                        {error && <p>{texts.error}</p>}
                        {!loading && (enrichedUserPosts.length === 0 && userPosts.length === 0) ? (
                            <p>{texts.noPosts}</p>
                        ) : (
                            (enrichedUserPosts.length > 0 ? enrichedUserPosts : userPosts).map(post => (
                                <Post
                                    key={post._id}
                                    postId={post._id}
                                    authorId={post.authorId}
                                    authorName={post.authorUserName}
                                    authorHandle={post.authorHandle}
                                    profilePic={post.profilePic}
                                    timeAgo={post.createdAt}
                                    textContent={post.textContent}
                                    mediaUrl={post.mediaUrl}
                                    mediaType={post.mediaType}
                                    retweets={post.retweets}
                                    likes={post.likes}
                                    isLiked={post.isLiked}
                                    isSubscribed={post.isSubscribed || false}
                                    comments={post.comments.length}
                                    showControls={true}
                                    showControlsReport={false}
                                    onUpdatePost={(deletedPostId, data) => {
                                        if (!data) {
                                            // Si `data` est null, c'est une suppression
                                            setUserPosts(prevPosts => prevPosts.filter(p => p._id !== deletedPostId));
                                            setEnrichedUserPosts(prevPosts => prevPosts.filter(p => p._id !== deletedPostId));
                                        } else {
                                            // Sinon c'est une mise à jour
                                            setUserPosts(prevPosts =>
                                                prevPosts.map(p => (p._id === deletedPostId ? { ...p, ...data } : p))
                                            );
                                            setEnrichedUserPosts(prevPosts =>
                                                prevPosts.map(p => (p._id === deletedPostId ? { ...p, ...data } : p))
                                            );
                                        }
                                    }}
                                />
                            ))

                        )}
                    </section>
                )}
 
                {activeTab === 'comments' && (
                    <section className="feed-section">
                        <h2>{texts.postedComments}</h2>
                        {userComments.length === 0 ? (
                            <p>{texts.noComments}</p>
                        ) : (
                            <div className="comment-list">
                                {userComments.map(comment => (
                                    <CommentProfil key={comment._id} commentId={comment._id} />
                                ))}
                            </div>
                        )}
                    </section>
                )}
 
                {activeTab === 'likes' && (
                    <section className="feed-section">
                        <h2>{texts.likedPosts}</h2>
                        {enrichedLikedPosts.length === 0 ? (
                            <p>{texts.noLikedPosts}</p>
                        ) : (
                            enrichedLikedPosts.map((like) => (
                                <LikeProfil
                                    key={like._id}
                                    like={like}
                                    onUnlike={() => {
                                        setLikedPosts(prev => prev.filter(l => l._id !== like._id));
                                        setEnrichedLikedPosts(prev => prev.filter(l => l._id !== like._id));
                                    }}
                                />
                            ))
                        )}
 
                    </section>
                )}
 
                {activeTab === 'followers' && (
                    <section className="feed-section">
                        {followers.length === 0 ? (
                        <p>Tu n'as pas encore de followers.</p>
                        ) : (
                            followers.map(user => {
                                // Pour les followers, on utilise authorId (celui qui nous suit)
                                const followerId = user.authorId;
                                const isSubscribed = follow.some(f => f.authorIdFollowed === followerId);
                                return (
                                    <FollowerCard
                                        key={user._id}
                                        user={{ authorId: followerId }}
                                        authorId={followerId}
                                        isSubscribed={isSubscribed}
                                        userId={userId}
                                    />
                                );
                            })
                        )}
                    </section>
 
                )}
 
                {activeTab === 'follow' && (
                    <section className="feed-section">
                        {follow.length === 0 ? (
                        <p>Tu n'as pas encore de follow quelqu'un.</p>
                        ) : (
                            follow.map(user => {
                                return (
                                    <FollowerCard
                                        key={user._id}
                                        user={{ authorId: user.authorIdFollowed }}
                                        authorId={user.authorIdFollowed}
                                        isSubscribed={true}
                                        userId={userId}
                                    />
                                );
                            })
                        )}
                    </section>
                )}
            </main>
           
 
            <nav className="bottom-navbar mobile-only">
                <BottomBar userId={userId} activePage="profile" />
            </nav>
        </div>
    );
};
 
export default UserPage;