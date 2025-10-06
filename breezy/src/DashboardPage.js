import React, { useEffect, useState } from 'react';
import './DashboardPage.css'; // Pour les styles spécifiques à cette page
import BreezModal from './components/BreezModal';
import Post from './components/Post';
import ProfileModal from './components/ProfileModal';
import BottomBar from './components/bottombar';
import Sidebar from './components/sidebar';
import { useSocket } from './context/SocketContext';
import apiService from './services/apiService';

const DashboardPage = () => {

    const { userId, userName, userRole } = useSocket();
    // const [breezeList, setBreezeList] = React.useState([]); // État pour la liste des brises (breezes)
    const [enrichedPosts, setEnrichedPosts] = React.useState([]); // Posts avec données additionnelles
    const [loading, setLoading] = React.useState(true); // État de chargement
    const [error, setError] = React.useState(null); // État pour les erreurs
    const [showBreezModal, setShowBreezModal] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);


    // Fonction pour enrichir les posts avec toutes les données nécessaires
    const enrichPostsData = async (posts, currentUserId) => {
        if (!posts.length || !currentUserId) return [];

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

            // setLoading(false);

            // Enrichir les posts avec toutes les données
            return posts.map(post => ({
                ...post,
                likes: likesMap.get(post._id) || 0,
                isLiked: likedMap.get(post._id) || false,
                isSubscribed: subscriptionsMap.get(post.authorId) || false,
                isDataLoaded: true // Marquer comme chargé
            }));

        } catch (err) {
            console.error("Erreur lors de l'enrichissement des posts :", err);
            return posts.map(post => ({ ...post, isDataLoaded: false }));
        }
    };

    useEffect(() => {
        const initializeData = async () => {
            // setLoading(true);
            try {
                const response = await apiService.gateway.get('/getallbreez');
                const rawBreezes = response.data;
                // setBreezeList(rawBreezes); // Pour mise à jour d’état

                setLoading(true);

                if (userId && rawBreezes.length > 0) {
                    const enriched = await enrichPostsData(rawBreezes, userId);
                    setEnrichedPosts(enriched);
                }

                setLoading(false);

            } catch (err) {
                console.error("Erreur dans initializeData:", err);
                setError(err);
            }
            // setLoading(false);
        };

        initializeData();
    }, [userId]); // ✅ Déclenché quand userId est prêt

    const handleCreateBreez = async ({ textContent, mediaUrl, mediaType }) => {
        try {
            const payload = {
                authorId: userId,
                authorUserName: userName,
                textContent,
                mediaUrl: mediaUrl || null,
                mediaType: mediaType || null,
                createdAt: new Date().toISOString()
            };

            await apiService.gateway.post('/addbreez', payload);

            setShowBreezModal(false);

            // Recharger tous les posts, enrichis
            const response = await apiService.gateway.get('/getallbreez');
            const rawBreezes = response.data;

            setLoading(true);

            if (userId && rawBreezes.length > 0) {
                const enriched = await enrichPostsData(rawBreezes, userId);
                setEnrichedPosts(enriched);
            }

            setLoading(false);

        } catch (err) {
            console.error("Erreur lors de la publication :", err);
            alert("Erreur lors de la création du post.");
        }
    };



    // Fonction pour mettre à jour un post spécifique (pour éviter de recharger tous les posts)
    const updatePostData = (postId, updates) => {
        setEnrichedPosts(prevPosts =>
            prevPosts.map(post =>
                post._id === postId ? { ...post, ...updates } : post
            )
        );
    };

    // Fonction pour mettre à jour les abonnements de tous les posts d'un auteur
    const updateAuthorSubscription = (authorId, isSubscribed) => {
        setEnrichedPosts(prevPosts =>
            prevPosts.map(post =>
                post.authorId === authorId ? { ...post, isSubscribed } : post
            )
        );
    };


    return (
        <div className="dashboard-layout">

            <Sidebar userId={userId} activePage="home"/>

            {/* Contenu principal de la page (commun aux deux versions) */}
            <main className="main-content-area">
                <button 
                    className="floating-post-button" 
                    onClick={() => setShowBreezModal(true)}
                    aria-label="Breezer"
                >
                    <i className="fas fa-feather-alt"></i>
                </button>

                {/* Fil d'actualité / Contenu principal */}
                <section className="feed-section">
                    {loading ? (
                        <div className="loading-placeholder">
                            <div className="loading-spinner"></div>
                            <p>Chargement des posts...</p>
                        </div>
                    ) : error ? (
                        <div className="error-placeholder">
                            <p>Erreur lors du chargement des posts</p>
                        </div>
                    ) : (
                        /* Afficher uniquement les posts entièrement chargés */
                        enrichedPosts
                            .filter(post => post.isDataLoaded) // Ne montrer que les posts avec données complètes
                            .map(post => (
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
                                    likes={post.likes}
                                    isLiked={post.isLiked}
                                    isSubscribed={post.isSubscribed}
                                    onUpdatePost={updatePostData}
                                    onUpdateAuthorSubscription={updateAuthorSubscription}
                                    onShowProfile={(id) => {
                                        setSelectedUserId(post.authorId);
                                        setShowProfileModal(true);
                                    }}
                                />
                            ))
                    )}
                </section>

                {/* Pied de page (optionnel ou minimal) */}
                <footer className="footer-section mobile-hidden">
                    <p>&copy; 2025 Breezy. Tous droits réservés.</p>
                </footer>
            </main>

            {/* Barre de navigation inférieure (Mobile Only) */}
            <nav className="bottom-navbar mobile-only">
                <BottomBar userId={userId} activePage="home" />
            </nav>

            <BreezModal
                isOpen={showBreezModal}
                onClose={() => setShowBreezModal(false)}
                onSubmit={handleCreateBreez}
            />
            <ProfileModal
            isOpen={showProfileModal}
            onClose={() => setShowProfileModal(false)}
            userId={selectedUserId}
            />


        </div>
    );
};

export default DashboardPage;