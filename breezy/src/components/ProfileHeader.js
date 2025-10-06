// src/components/ProfileHeader.js
import apiService from '../services/apiService';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUserId } from "../utils/utils";
import './ProfileHeader.css';

const ProfileHeader = () => {
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [preview, setPreview] = useState('');
  const fileInputRef = useRef();
  const [biographie, setBiographie] = useState('');

  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const id = await getCurrentUserId();
        setUserId(id);
        const res = await apiService.gateway.get(`/profile/${id}`);
        setUserName(res.data.username || 'Nom inconnu');
        setProfilePicture(res.data.profileImage || '');
        setPreview(res.data.profileImage || '');
        setBiographie(res.data.biographie || '');

      } catch (error) {
        console.error("Erreur lors du fetch user:", error);
      }
    };
    fetchUserData();
  }, []);

  const handleFileChange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    const form = new FormData();
    form.append('file', file);
    try {
      const uploadRes = await fetch(`${process.env.REACT_APP_URL_API_MEDIA}upload`, {
        method: 'POST',
        body: form
      });
      const data = await uploadRes.json();
      await apiService.gateway.patch(`/profile/${userId}`, {
        profilePicture: data.profileImage
      });
      setProfilePicture(data.profileImage);
      setPreview(data.profileImage);
    } catch (err) {
      console.error('Erreur upload image:', err);
      setPreview(profilePicture); // rollback si échec
    }
  };
  
  return (
    <div className="profile-header">
      <div className="avatar-wrapper">
        <img
          className="avatar-img"
          src={preview || "http://98.66.153.160:3060/media/1750086730572-avatar.png"}
          alt="Photo de profil"
        />
        
      </div>
      <h1 className="username">{userName || "Chargement..."}</h1>
      {biographie && (
    <p className="biography-text">{biographie}</p>
  )}

      
      <Link to="/edit-profile" className="edit-button" >
        <i className="fas fa-edit"></i> Éditer le profil
      </Link>
    </div>
  );
};

export default ProfileHeader;
