import React, { useEffect, useState } from 'react';
import './DashboardPage.css';
import Post from './components/Post';
import FollowerCard from './components/FollowerCard';
import Sidebar from './components/sidebar';
import BottomBar from './components/bottombar';
import { getCurrentUserId, getCurrentUserName } from './utils/utils';
import ParametersPage from './components/ParametersPage';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from './context/LanguageContext';
import apiService from './services/apiService';
import { FaSearch } from 'react-icons/fa';

import "./ExplorerPage.css"; // Importer le CSS spécifique pour l'explorateur

const ExplorerPage = () => {
    const [query, setQuery] = useState('');
    const [posts, setPosts] = useState([]);
    const [enrichedPosts, setEnrichedPosts] = useState([]);
    const [userPosts, setUserPosts] = useState([]);
    const [enrichedUserPosts, setEnrichedUserPosts] = useState([]);
    const [users, setUsers] = useState([]);
    const [userId, setUserId] = useState(null);
    const [userName, setUserName] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showParametersModal, setShowParametersModal] = useState(false);
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'posts', 'users'
    const { texts } = useLanguage();
    
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const id = await getCurrentUserId();
                const name = getCurrentUserName();
                setUserId(id);
                setUserName(name);
            } catch (err) {
                console.error("Erreur lors du chargement de l'utilisateur :", err);
                setError(err);
            }
        };

        fetchUserData();
    }, []);

    useEffect(() => {
        const fetchResults = async () => {
            if (query.trim()) {
                try {
                    setLoading(true);
                    setError(null);
                    const res = await apiService.gateway.get(`/explorer?q=${encodeURIComponent(query)}`);
                    
                    if (userId) {
                        // Enrichir les posts avec les états d'abonnement et likes
                        const enrichedPostsData = await enrichPostsData(res.data.posts || [], userId);
                        setEnrichedPosts(enrichedPostsData);
                        
                        // Enrichir les userPosts avec les états d'abonnement et likes
                        const enrichedUserPostsData = await enrichPostsData(res.data.userPosts || [], userId);
                        setEnrichedUserPosts(enrichedUserPostsData);
                        
                        // Enrichir les utilisateurs avec les états d'abonnement
                        const enrichedUsers = await enrichUsersData(res.data.users || [], userId);
                        setUsers(enrichedUsers);
                    } else {
                        // Si userId n'est pas encore disponible, afficher les données brutes
                        setEnrichedPosts(res.data.posts || []);
                        setEnrichedUserPosts(res.data.userPosts || []);
                        setUsers(res.data.users || []);
                    }
                    
                    setLoading(false);
                } catch (err) {
                    console.error("Erreur recherche explorer :", err);
                    setError(err);
                    setLoading(false);
                }
            } else {
                try {
                    setLoading(true);
                    const res = await apiService.gateway.get('/explorer/recent');
                    
                    if (userId) {
                        // Enrichir les posts récents
                        const enrichedPostsData = await enrichPostsData(res.data.posts || [], userId);
                        setEnrichedPosts(enrichedPostsData);
                    } else {
                        // Si userId n'est pas encore disponible, afficher les données brutes
                        setEnrichedPosts(res.data.posts || []);
                    }
                    
                    setUsers([]); // pas de users par défaut
                    setEnrichedUserPosts([]);
                    setLoading(false);
                } catch (err) {
                    console.error("Erreur posts récents :", err);
                    setError(err);
                    setLoading(false);
                }
            }
        };

        const debounceTimer = setTimeout(fetchResults, 300); // Debounce pour éviter trop de requêtes
        return () => clearTimeout(debounceTimer);
    }, [query, userId]);

    // Écouter les événements de mise à jour des abonnements
    useEffect(() => {
        const handleSubscriptionUpdate = (event) => {
            const { authorId, isSubscribed } = event.detail;
            updateAuthorSubscription(authorId, isSubscribed);
        };

        window.addEventListener('subscriptionUpdate', handleSubscriptionUpdate);
        return () => {
            window.removeEventListener('subscriptionUpdate', handleSubscriptionUpdate);
        };
    }, []);

    const handleOpenParameters = () => {
        setShowParametersModal(true);
    };

    const handleCloseParameters = () => {
        setShowParametersModal(false);
    };

    const handlePostClick = (postId) => {
        navigate(`/breez/${postId}`);
    };

    const handleUserClick = (userId) => {
        navigate(`/profile/${userId}`);
    };

    const updateAuthorSubscription = (authorId, isSubscribed) => {
        setUsers(prevUsers =>
            prevUsers.map(user =>
                user._id === authorId ? { ...user, isSubscribed } : user
            )
        );
        
        // Mettre à jour aussi les posts de cet auteur
        setEnrichedPosts(prevPosts =>
            prevPosts.map(post =>
                post.authorId === authorId ? { ...post, isSubscribed } : post
            )
        );
        
        setEnrichedUserPosts(prevPosts =>
            prevPosts.map(post =>
                post.authorId === authorId ? { ...post, isSubscribed } : post
            )
        );
    };

    const filteredPosts = enrichedPosts;
    const filteredUsers = users;

    const showPosts = activeTab === 'all' || activeTab === 'posts';
    const showUsers = activeTab === 'all' || activeTab === 'users';

    // Fonction pour enrichir les utilisateurs avec les états d'abonnement
    const enrichUsersData = async (users, currentUserId) => {
        if (!users.length || !currentUserId) return [];

        try {
            // Récupérer tous les états d'abonnement en une fois
            const subscriptionPromises = users.map(user =>
                apiService.gateway.get(`/issubscribed/${currentUserId}/${user._id}`)
                    .then(res => ({ userId: user._id, isSubscribed: res.data.isSubscribed }))
                    .catch(err => ({ userId: user._id, isSubscribed: false, error: err }))
            );

            const subscriptionResults = await Promise.all(subscriptionPromises);
            const subscriptionMap = new Map(subscriptionResults.map(item => [item.userId, item.isSubscribed]));

            // Enrichir les utilisateurs avec les états d'abonnement
            return users.map(user => ({
                ...user,
                isSubscribed: subscriptionMap.get(user._id) || false
            }));

        } catch (err) {
            console.error("Erreur lors de l'enrichissement des utilisateurs :", err);
            return users.map(user => ({ ...user, isSubscribed: false }));
        }
    };

    // Fonction pour enrichir les posts avec les états d'abonnement et likes
    const enrichPostsData = async (posts, currentUserId) => {
        if (!posts.length || !currentUserId) {
            return [];
        }

        try {
            // Créer des batches d'appels API pour éviter les doublons
            const postIds = posts.map(post => post._id);
            const authorIds = [...new Set(posts.map(post => post.authorId))]; // Éviter les doublons d'auteurs

            // Batch des appels API
            const [likesData, likedPostsData, subscriptionsData] = await Promise.all([
                // Récupérer tous les nombres de likes en une fois
                Promise.all(postIds.map(postId =>
                    apiService.gateway.get(`/getnblikebreez/${postId}`)
                        .then(res => ({ postId, nbLikes: res.data.nbLikes }))
                        .catch(err => ({ postId, nbLikes: 0, error: err }))
                )),

                // Vérifier tous les posts likés en une fois
                Promise.all(postIds.map(postId =>
                    apiService.gateway.get(`/alreadylike/${currentUserId}/${postId}`)
                        .then(res => ({ postId, isLiked: res.data }))
                        .catch(err => ({ postId, isLiked: false, error: err }))
                )),

                // Vérifier tous les abonnements en une fois (uniquement les auteurs uniques)
                Promise.all(authorIds.map(authorId =>
                    apiService.gateway.get(`/issubscribed/${currentUserId}/${authorId}`)
                        .then(res => ({ authorId, isSubscribed: res.data.isSubscribed }))
                        .catch(err => ({ authorId, isSubscribed: false, error: err }))
                ))
            ]);

            // Créer des maps pour un accès rapide
            const likesMap = new Map(likesData.map(item => [item.postId, item.nbLikes]));
            const likedMap = new Map(likedPostsData.map(item => [item.postId, item.isLiked]));
            const subscriptionsMap = new Map(subscriptionsData.map(item => [item.authorId, item.isSubscribed]));

            // Enrichir les posts avec toutes les données
            const enriched = posts.map(post => ({
                ...post,
                likes: likesMap.get(post._id) || 0,
                isLiked: likedMap.get(post._id) || false,
                isSubscribed: subscriptionsMap.get(post.authorId) || false
            }));

            return enriched;

        } catch (err) {
            console.error("Erreur lors de l'enrichissement des posts :", err);
            return posts.map(post => ({ ...post, likes: 0, isLiked: false, isSubscribed: false }));
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar userId={userId} activePage="explorer" onOpenParameters={handleOpenParameters} />

            <main className="main-content-area">
                <section className="dashboard-hero-minified">
                    <h2 className="welcome-title-minified">{texts.explore}</h2>
                   <div className="search-bar-wrapper">
                    <FaSearch className="search-icon"/>
                    <input
                        type="text"
                        className="search-input"
                        placeholder={texts.searchPlaceholder}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    </div>
                    
                    {/* Onglets de filtrage */}
                    {query && (enrichedPosts.length > 0 || enrichedUserPosts.length > 0 || users.length > 0) && (
                        <div className="search-tabs">
                            <button 
                                className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
                                onClick={() => setActiveTab('all')}
                            >
                                Tout ({enrichedPosts.length + enrichedUserPosts.length + users.length})

                            </button>
                            <button 
                                className={`tab-button ${activeTab === 'posts' ? 'active' : ''}`}
                                onClick={() => setActiveTab('posts')}
                            >
                                Posts ({enrichedPosts.length + enrichedUserPosts.length})
                            </button>
                            <button 
                                className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
                                onClick={() => setActiveTab('users')}
                            >
                                Utilisateurs ({users.length})
                            </button>
                        </div>
                    )}
                </section>

                <section className="feed-section">
                    {loading ? (
                        <div className="loading-placeholder">
                            <div className="loading-spinner"></div>
                            <p>{texts.loading}</p>
                        </div>
                    ) : error ? (
                        <div className="error-placeholder">
                            <p>{texts.error}</p>
                        </div>
                    ) : (
                        <>
                            {/* Résultats de recherche pour les utilisateurs */}
                            {query && showUsers && (
                                <>
                                    <h3 className="section-title">{texts.usersFound}</h3>
                                    {console.log("Debug users section:", { 
                                        query, 
                                        showUsers, 
                                        filteredUsersLength: filteredUsers.length,
                                        usersLength: users.length,
                                        activeTab 
                                    })}
                                    {filteredUsers.length === 0 ? (
                                        <p>{texts.noUserFound}</p>
                                    ) : (
                                <div className="users-grid">
                                    {filteredUsers.map((user, index) => {
                                        const adaptedUser = {
                                            ...user,
                                            authorId: user._id,
                                            authorUserName: user.username
                                        };

                                        return (
                                            <div key={user._id || index}>
                                                <FollowerCard
                                                    user={adaptedUser}
                                                    authorId={user._id}
                                                    isSubscribed={user.isSubscribed}
                                                    userId={userId}
                                                    onUpdateAuthorSubscription={updateAuthorSubscription}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                                    )}
                                </>
                            )}

                            {/* Résultats de recherche pour les posts */}
                            {showPosts && (
                            <>
                                {enrichedUserPosts.length > 0 && (
                                <>
                                    <h3 className="section-title">Breez des utilisateurs trouvés</h3>
                                    <div className="posts-container">
                                    {enrichedUserPosts.map((post) => (
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
                                        comments={post.comments?.length || 0}
                                        retweets={post.retweets || 0}
                                        likes={post.likes || 0}
                                        isLiked={post.isLiked || false}
                                        isSubscribed={post.isSubscribed || false}
                                        onClickPost={handlePostClick}
                                        />
                                    ))}
                                    </div>
                                </>
                                )}

                                {enrichedPosts.length > 0 && (
                                <>
                                    <h3 className="section-title">Breez contenant "{query}"</h3>
                                    <div className="posts-container">
                                    {enrichedPosts.map((post) => (
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
                                        comments={post.comments?.length || 0}
                                        retweets={post.retweets || 0}
                                        likes={post.likes || 0}
                                        isLiked={post.isLiked || false}
                                        isSubscribed={post.isSubscribed || false}
                                        onClickPost={handlePostClick}
                                        />
                                    ))}
                                    </div>
                                </>
                                )}
                            </>
                            )}

                            {/* Message si aucun résultat */}
                            {query && enrichedPosts.length === 0 && users.length === 0 && !loading && (
                                <div className="no-results">
                                    <p>Aucun résultat trouvé pour "{query}"</p>
                                    <p>Essayez avec d'autres mots-clés</p>
                                </div>
                            )}
                        </>
                    )}
                </section>

                <footer className="footer-section mobile-hidden">
                    <p>{texts.footerText}</p>
                </footer>
            </main>

            <nav className="bottom-navbar mobile-only">
                <BottomBar userId={userId} activePage="explorer" />
            </nav>

            {showParametersModal && (
                <ParametersPage handleCloseParameters={handleCloseParameters} />
            )}
        </div>
    );
};

export default ExplorerPage;    