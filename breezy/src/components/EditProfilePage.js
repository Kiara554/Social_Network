import apiService from '../services/apiService';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUserId } from '../utils/utils';
import './EditProfilePage.css';

const EditProfilePage = () => {
  const [userId, setUserId] = useState(null);
  const [authorName, setAuthorName] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [preview, setPreview] = useState('');
  const fileInputRef = useRef();
  const navigate = useNavigate(); 
  const [biographie, setBiographie] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      const id = await getCurrentUserId();
      setUserId(id);
      const res = await apiService.gateway.get(`/profile/${id}`);
      console.log(res.data);
      setAuthorName(res.data.username || '');
      setProfilePicture(res.data.profileImage || '');
      setPreview(res.data.profileImage || '');
      setBiographie(res.data.biographie || '');
      setEmail(res.data.email || '');
    };
    fetchUserData();
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
   
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    const form = new FormData();
    form.append('file', file);

    const uploadRes = await fetch(`${process.env.REACT_APP_URL_API_MEDIA}/upload`, {
      method: 'POST',
      body: form,
    });

    const data = await uploadRes.json();
    setProfilePicture(data.fileUrl);
  };

  const handleSave = async () => {
    await apiService.gateway.patch(`/profile/user/${userId}`, {
      email: email,
      username: authorName
    });
    await apiService.gateway.put(`/profile/${userId}`, {
      profileImage: profilePicture,
      biographie: biographie,
    });
    // navigate(`/profil/${userId}`); // redirige vers la page de profil
    navigate(`/profil/${userId}`, { state: { updated: true } });

  };

  return (
    <div className="edit-profile-container">
      <h2>Éditer le profil</h2>

      <div className="edit-avatar">
        <img className="avatar-img" src={preview || "/default-avatar.png"} alt="Avatar" />
        <label htmlFor="photo-upload" className="upload-btn">
          <i className="fas fa-plus"></i>
        </label>
        <input
          id="photo-upload"
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      <div className="edit-field">
        <label>Nom d'utilisateur</label>
        <input
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
        />
      </div>
      <div className="edit-field">
  <label>Biographie</label>
  <textarea
    value={biographie}
    onChange={(e) => setBiographie(e.target.value)}
    rows={4}
    style={{ width: '100%', padding: '10px', borderRadius: '5px', resize: 'vertical' }}
  />
</div>


      <button className="save-btn" onClick={handleSave}>Enregistrer</button>

    </div>
  );
};

export default EditProfilePage;
