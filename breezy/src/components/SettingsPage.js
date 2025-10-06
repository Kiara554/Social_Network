import apiService from '../services/apiService';
import Cookies from 'js-cookie';
import { useEffect, useState } from 'react';
import '../DashboardPage.css'; // utilise déjà ton style global

const SettingsPage = () => {
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState({});
  const [updatedName, setUpdatedName] = useState('');
  const [updatedProfilePicture, setUpdatedProfilePicture] = useState('');

  useEffect(() => {
    const fetchUserIdAndProfile = async () => {
      try {
        // Avec HttpOnly cookies, le token est envoyé automatiquement
        const res = await apiService.auth.get('/get-payload');
        const id = res.data.user.userId;
        setUserId(id);

        const profileRes = await apiService.gateway.get(`/profilestats/${id}`);
        setProfile(profileRes.data);
        setUpdatedName(profileRes.data.authorName || '');
        setUpdatedProfilePicture(profileRes.data.profilePicture || '');
      } catch (error) {
        console.error("Erreur récupération utilisateur :", error);
      }
    };

    fetchUserIdAndProfile();
  }, []);

  const handleUpdate = async () => {
    try {
      await apiService.gateway.patch(`/profilestats/${userId}`, {
        authorName: updatedName,
        profilePicture: updatedProfilePicture
      });
      alert("Profil mis à jour !");
    } catch (err) {
      console.error("Erreur mise à jour :", err);
      alert("Erreur lors de la mise à jour du profil.");
    }
  };

  return (
    <div className="main-content-area">
      <h2>Paramètres du profil</h2>
      <div className="profile-section">
        <img
          src={updatedProfilePicture || "https://via.placeholder.com/100"}
          alt="Profil"
          style={{ width: 120, height: 120, borderRadius: '50%' }}
        />
        <label>Nom d'utilisateur</label>
        <input
          type="text"
          value={updatedName}
          onChange={(e) => setUpdatedName(e.target.value)}
        />
        <label>Photo de profil (URL)</label>
        <input
          type="text"
          value={updatedProfilePicture}
          onChange={(e) => setUpdatedProfilePicture(e.target.value)}
        />
        <button className="btn primary" onClick={handleUpdate}>Enregistrer</button>
      </div>
      <div className="follow-stats">
        <p><strong>Followers :</strong> {profile.followers || 0}</p>
        <p><strong>Following :</strong> {profile.following || 0}</p>
      </div>
    </div>
  );
};

export default SettingsPage;
