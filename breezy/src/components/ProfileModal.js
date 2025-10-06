import { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { getCurrentUserName } from '../utils/utils';
import './ProfileModal.css';
import apiService from '../services/apiService';

const ProfileModal = ({ isOpen, onClose, userId }) => {
  const [profile, setProfile] = useState(null);
  const [breezs, setBreezs] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const { socket, userId: currentUserId } = useSocket();

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchData = async () => {
      setDataLoading(true);
      try {
        const [profileRes, breezsRes, followersRes, followingRes, subRes] = await Promise.all([
          apiService.gateway.get(`/profile/${userId}`),
          apiService.gateway.get(`/getalluserbreez/${userId}`),
          apiService.gateway.get(`/followers/${userId}`),
          apiService.gateway.get(`/following/${userId}`),
          currentUserId !== userId ? 
            apiService.gateway.get(`/issubscribed/${currentUserId}/${userId}`) :
            Promise.resolve({ data: { isSubscribed: false } })
        ]);

        setProfile(profileRes.data);
        setBreezs(breezsRes.data);
        setFollowers(followersRes.data);
        setFollowing(followingRes.data);
        setIsSubscribed(subRes.data?.isSubscribed || false);
      } catch (err) {
        console.error("Erreur de chargement dans ProfileModal :", err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [isOpen, userId, currentUserId]);

  // Synchronisation globale des abonnements
  useEffect(() => {
    const handler = (e) => {
      if (e.detail.authorId === userId) {
        setIsSubscribed(e.detail.isSubscribed);
        // Mettre à jour le nombre de followers
        if (e.detail.isSubscribed) {
          setFollowers(prev => [...prev, { _id: currentUserId }]);
        } else {
          setFollowers(prev => prev.filter(follower => follower._id !== currentUserId));
        }
      }
    };
    window.addEventListener('subscriptionUpdate', handler);
    return () => window.removeEventListener('subscriptionUpdate', handler);
  }, [userId, currentUserId]);

  const handleFollowClick = async (e) => {
    e.stopPropagation();
    if (isLoading || userId === currentUserId) return;
    setIsLoading(true);

    const newIsSubscribed = !isSubscribed;

    try {
      if (isSubscribed) {
        await apiService.gateway.delete(`/unfollow/${currentUserId}/${userId}`);
      } else {
        await apiService.gateway.post('/follow', {
          authorId: currentUserId,
          authorIdFollowed: userId
        });

        await apiService.gateway.post('/conversations', {
          participants: [currentUserId, userId]
        });

        const username = await getCurrentUserName();

        await apiService.gateway.post('/notify', {
          userId,
          notifyType: "SUBSCRIBE",
          notifyContent: `${username} s'est abonné à toi !`
        });

        socket.emit("notify-subscribed", {
          subscriberId: currentUserId,
          subscribingId: userId
        });
      }

      setIsSubscribed(newIsSubscribed);

      // Propagation à tous les composants
      window.dispatchEvent(new CustomEvent("subscriptionUpdate", {
        detail: { authorId: userId, isSubscribed: newIsSubscribed }
      }));

    } catch (err) {
      console.error("Erreur (abonnement / désabonnement) :", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>

        {dataLoading ? (
          <div className="profile-modal loading">
            <div className="loading-spinner"></div>
            <p>Chargement du profil...</p>
          </div>
        ) : profile ? (
          <div className="profile-modal">
            <div className="profile-header">
              <div className="profile-info">
                <img
                  className="profile-picture"
                  src={profile.profileImage || "/default-avatar.png"}
                  alt="profile"
                />
                <div className="profile-details">
                  <div className="username">{profile.username}</div>
                  <div className="bio">{profile.biographie}</div>
                  <div className="profile-stats">
                    <div className="stat-item">
                      <span className="stat-number">{breezs.length}</span>
                      <span className="stat-label">Posts</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{followers.length}</span>
                      <span className="stat-label">Followers</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{following.length}</span>
                      <span className="stat-label">Following</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {String(currentUserId) !== String(userId) && (
                <button
                  onClick={handleFollowClick}
                  className={`follow-button ${isSubscribed ? 'subscribed' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span>...</span>
                  ) : (
                    isSubscribed ? "Abonné" : "S'abonner"
                  )}
                </button>
              )}
            </div>

            {profile.bio && (
              <div className="profile-bio">
                <p>{profile.bio}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="profile-modal error">
            <p>Impossible de charger le profil</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;