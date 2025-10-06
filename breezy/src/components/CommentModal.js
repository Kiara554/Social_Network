// src/components/CommentModal.js
import React, { useState } from 'react';
import './CommentModal.css'; // Create this CSS file next

const CommentModal = ({ isOpen, onClose, onSubmit, replyToComment }) => {
    const [commentText, setCommentText] = useState('');
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);


    if (!isOpen) {
        return null;
    }

    const handleSubmit = async (e) => {
        let mediaUrl = null;
        let mediaType = null;
        e.preventDefault();

        if (commentText.trim()) {
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
                    console.log('Media uploaded:', mediaUrl, mediaType);
                } catch (err) {
                    console.error('Erreur upload media:', err);
                    alert('Erreur lors du téléchargement du fichier.');
                    return;
                }
                }

            onSubmit(commentText, mediaUrl, mediaType); // Pass the comment text to the parent's onSubmit
            setCommentText(''); // Clear the input
            setFile(null);
            setPreviewUrl(null);
        } else {
            alert("Le commentaire ne peut pas être vide.");
        }
    };

    
const handleClose = () => {
setCommentText("");
setFile(null);
setPreviewUrl(null);
onClose();
};

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}> {/* Prevent clicks inside from closing */}
                <div className="modal-header">
                    <h2>{replyToComment ? `Répondre à ${replyToComment.authorName}` : 'Ajouter un Commentaire'}</h2>
                    <button className="modal-close-button" onClick={onClose}>&times;</button>
                </div>
                
                {replyToComment && (
                    <div className="reply-context">
                        <p>En réponse à <strong>@{replyToComment.authorName}</strong></p>
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="comment-modal-form">
                    <textarea
                        className="comment-modal-textarea"
                        placeholder={replyToComment ? `Répondre à @${replyToComment.authorName}...` : "Écrivez votre commentaire ici..."}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        rows="5"
                    ></textarea>
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
                        <button type="button" className="btn secondary" onClick={handleClose}>Annuler</button>
                        <button type="submit" className="btn primary">Publier Commentaire</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CommentModal;