import React, { useState } from 'react';
import './BreezModal.css';

const BreezModal = ({ isOpen, onClose, onSubmit }) => {
  const [textContent, setTextContent] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    let mediaUrl = null;
    let mediaType = null;

    if (file) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await fetch(`${process.env.REACT_APP_URL_API_MEDIA}/upload`, {
          method: 'POST',
          body: formData
        });

        const data = await uploadRes.json();
        mediaUrl = data.fileUrl;
        mediaType = file.type.startsWith('image/') ? 'image' : 'video';
      } catch (err) {
        console.error('Erreur upload media:', err);
        alert('Erreur lors du téléchargement du fichier.');
        return;
      }
    }

    onSubmit({
      textContent,
      mediaUrl,
      mediaType
    });

    // Nettoyage
    setTextContent("");
    setFile(null);
    setPreviewUrl(null);
  };

  const handleClose = () => {
    setTextContent("");
    setFile(null);
    setPreviewUrl(null);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Nouveau Breez</h2>

        <textarea
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          placeholder="Exprime-toi ici..."
          rows={4}
        />

        <label className="file-upload-button">
              📎 Ajouter une image ou vidéo
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden-file-input"
                onChange={(e) => {
                  const selectedFile = e.target.files[0];
                  setFile(selectedFile);
                  if (selectedFile) {
                    const url = URL.createObjectURL(selectedFile);
                    setPreviewUrl(url);
                  } else {
                    setPreviewUrl(null);
                  }
                }}
              />
            </label>

        {previewUrl && (
          <div className="preview-container" style={{ marginTop: '10px' }}>
            {file.type.startsWith('image/') ? (
              <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px' }} />
            ) : (
              <video src={previewUrl} controls style={{ maxWidth: '100%', maxHeight: '200px' }} />
            )}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn" onClick={handleClose}>Annuler</button>
          <button className="btn primary" onClick={handleSubmit}>Breezer</button>
        </div>
      </div>
    </div>
  );
};

export default BreezModal;
// BreezModal.js
// Ce composant modal permet à l'utilisateur de créer un nouveau "Breez" (post).
// Il inclut un champ de texte pour le contenu, un champ de fichier pour les médias,
// et un aperçu du média sélectionné. Lors de la soumission, il envoie les données