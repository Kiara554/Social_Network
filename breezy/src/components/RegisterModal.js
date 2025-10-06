import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Modal.css';
import apiService from '../services/apiService';
import authService from '../services/authService';
import useFormValidation from '../hooks/useFormValidation';


const RegisterModal = ({ onClose, onSwitchToLogin }) => {

    // États pour stocker les valeurs des champs d'inscription
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // Utilisation du hook personnalisé de validation
    const {
        errors,
        isLoading,
        apiError,
        setIsLoading,
        validateRegisterForm,
        resetErrors,
        setApiErrorMessage
    } = useFormValidation();

    const navigate = useNavigate(); // Using useNavigate instead of useHistory

    const goToDashboard = () => {
        onClose(); // Close the modal first
        navigate('/dashboard'); // Then navigate to dashboard
    };

    // Fonction supprimée - utilisation du authService sécurisé

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Reset des erreurs précédentes
        resetErrors();

        // Validation côté client
        if (!validateRegisterForm({ username, email, password, confirmPassword })) {
            return;
        }

        setIsLoading(true);

        try{
            const response = await apiService.auth.post('/register', {
                    "username": username,
                    "password": password,
                    "email": email
                });
            console.log("Registration response :", response.data); // Pour le débogage

            // Avec HttpOnly cookies, le token est automatiquement géré côté serveur
            console.log("Registration successful - token set via HttpOnly cookie");

            console.log(response.data)
            // POST DANS GATEWAY (CREATION DU PROFILE)
            await apiService.gateway.post('/profile', {
                "userId": response.data.user.id,
            });

            goToDashboard();

        } catch (err) {
            console.error("Erreur", err);
            setApiErrorMessage(err, 'register');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSwitchToLogin = () => {
        onClose(); // Close the current modal
        onSwitchToLogin(); // Open the login modal
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>&times;</button>
                <h2>Inscription</h2>
                
                {apiError && (
                    <div className="error-message api-error">
                        {apiError}
                    </div>
                )}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="register-username">Nom d'utilisateur</label>
                        <input 
                            type="text" 
                            id="register-username" 
                            placeholder="Votre nom d'utilisateur"
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            required 
                            className={errors.username ? 'error' : ''}
                            disabled={isLoading}
                        />
                        {errors.username && <span className="error-message">{errors.username}</span>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="register-email">Email</label>
                        <input 
                            type="email" 
                            id="register-email" 
                            placeholder="Votre email"
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                            className={errors.email ? 'error' : ''}
                            disabled={isLoading}
                        />
                        {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="register-password">Mot de passe</label>
                        <input 
                            type="password" 
                            id="register-password" 
                            placeholder="Votre mot de passe"
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            className={errors.password ? 'error' : ''}
                            disabled={isLoading}
                        />
                        {errors.password && <span className="error-message">{errors.password}</span>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="register-confirm-password">Confirmer le mot de passe</label>
                        <input 
                            type="password" 
                            id="register-confirm-password" 
                            placeholder="Confirmer le mot de passe"
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                            required 
                            className={errors.confirmPassword ? 'error' : ''}
                            disabled={isLoading}
                        />
                        {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                    </div>
                    <button type="submit" className="btn primary" disabled={isLoading}>
                        {isLoading ? 'Inscription en cours...' : 'S\'inscrire'}
                    </button>
                </form>
                <p className="modal-link">Déjà un compte ? <a href="#" onClick={handleSwitchToLogin}>Se connecter</a></p>
            </div>
        </div>
    );
};

export default RegisterModal;
