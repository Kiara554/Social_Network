import React, { useState } from 'react';
import './BreezModal.css';
import apiService from '../services/apiService';

const UpdateBreez = ({ postId, currentText, mediaUrl, mediaType, isOpen, onClose, onUpdate }) => {
    const [textContent, setTextContent] = useState(currentText || '');
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(mediaUrl || null);
    const [currentMediaType, setCurrentMediaType] = useState(mediaType || null);

    const handleSubmit = async () => {
        let newMediaUrl = previewUrl;
        let newMediaType = currentMediaType;

        if (file) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                
                const uploadRes = await fetch(`${process.env.REACT_APP_URL_API_MEDIA}/upload`, {
                    method: 'POST',
                    body: formData
                });
              
                const data = await uploadRes.json();
                newMediaUrl = data.fileUrl;
                newMediaType = file.type.startsWith('image/') ? 'image' : 'video';
            } catch (err) {
                console.error('Erreur upload media:', err);
                alert('Erreur lors du téléchargement du fichier.');
                return;
            }
        }

        try {
            await apiService.gateway.patch(`/updatebreez/${postId}`, {
                textContent,
                mediaUrl: newMediaUrl,
                mediaType: newMediaType
            });

            onUpdate(textContent);
            handleClose();
        } catch (err) {
            console.error('Erreur mise à jour du breez:', err);
            alert('Échec de la mise à jour du post.');
        }
    };

    const handleDeleteImage = () => {
        setFile(null);
        setPreviewUrl(null);
        setCurrentMediaType(null);
    };

    const handleClose = () => {
        setFile(null);
        setPreviewUrl(mediaUrl || null);
        setCurrentMediaType(mediaType || null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Modifier le Breez</h2>

                <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Exprime-toi ici..."
                    rows={4}
                />

                <div className="media-actions">
                    <label className="file-upload-button">
                        📎 Modifier l'image
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
                                    setCurrentMediaType(selectedFile.type.startsWith('image/') ? 'image' : 'video');
                                }
                            }}
                        />
                    </label>
                    
                    {(previewUrl || mediaUrl) && (
                        <button 
                            className="delete-image-button"
                            onClick={handleDeleteImage}
                        >
                            🗑️ Supprimer l'image
                        </button>
                    )}
                </div>
                  
                {previewUrl && (
                    <div className="preview-container" style={{ marginTop: '10px' }}>
                        {currentMediaType === 'image' ? (
                            <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px' }} />
                        ) : (
                            <video src={previewUrl} controls style={{ maxWidth: '100%', maxHeight: '200px' }} />
                        )}
                    </div>
                )}

                <div className="modal-actions">
                    <button className="btn" onClick={handleClose}>Annuler</button>
                    <button className="btn primary" onClick={handleSubmit}>Sauvegarder</button>
                </div>
            </div>
        </div>
    );
};  

export default UpdateBreez;