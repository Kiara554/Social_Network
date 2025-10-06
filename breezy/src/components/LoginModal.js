import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Modal.css';
import apiService from '../services/apiService';
import authService from '../services/authService';
import useFormValidation from '../hooks/useFormValidation';
import { toast } from 'react-toastify';

const LoginModal = ({ onClose, onSwitchToRegister  }) => {

    // États pour stocker les valeurs des champs
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [is2FARequired, setIs2FARequired] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [isVerifying2FA, setIsVerifying2FA] = useState(false);
    const [loginToken, setLoginToken] = useState(''); // Token temporaire pour la 2FA

    // Utilisation du hook personnalisé de validation
    const {
        errors,
        isLoading,
        apiError,
        setIsLoading,
        validateLoginForm,
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
        if (!validateLoginForm({ identifier, password })) {
            return;
        }

        setIsLoading(true);

        try{

            const response = await apiService.auth.post('/login', {
                "identifier": identifier,
                "password": password
            });
            console.log("Login :", response.data); // Pour le débogage

            if (response.status === 403) {
                setApiErrorMessage(response, 'login');
                return;
            }

            // Test le code de retour
            if (response.status === 200) {
                // Check if the response contains a token
                if (response.data && response.data.token) {
                    const token = response.data.token;
                    // Stockage sécurisé du token
                    authService.setToken(token, 7);
                    console.log("Token stored securely in cookie.");

                    // POST DANS GATEWAY (CREATION DU PROFILE)
                    await apiService.gateway.post('/profile', {
                        "userId": response.data.user.id,
                    });

                } else {
                    console.warn("No token found in response data.");
                }
                goToDashboard();
            }
            if (response.status === 206) {
                // 2FA required
                console.log("2FA token received:", response.data.token);
                setIs2FARequired(true);
                setLoginToken(response.data.token || ''); // Store temporary token if provided
                toast.info('Authentification à deux facteurs requise');
            }

        } catch (err) {
            console.error("Erreur", err);
            setApiErrorMessage(err, 'login');
        } finally {
            setIsLoading(false);
        }
    };

    const verify2FACode = async () => {
        if (!verificationCode || verificationCode.length !== 6) {
            toast.error('Veuillez entrer un code à 6 chiffres');
            return;
        }

        if (!loginToken) {
            toast.error('Token de session manquant. Veuillez vous reconnecter.');
            handleBack();
            return;
        }

        try {
            setIsVerifying2FA(true);
            console.log("Sending 2FA verification with token:", loginToken ? loginToken.substring(0, 20) + '...' : 'NO TOKEN');

            const response = await apiService.auth.post('/verify-2fa-code', {
                code: verificationCode
            }, {
                headers: {
                    'Authorization': `Bearer ${loginToken}`
                }
            });

            console.log("2FA verification response:", response.status, response.data);

            if (response.status === 200 && response.data.success) {
                if (response.data.token) {
                    // Le token final est directement retourné par verify-2fa-code
                    const token = response.data.token;
                    authService.setToken(token, 7);
                    console.log("Token stored securely in cookie after 2FA.");
                    toast.success('Connexion réussie !');
                    goToDashboard();
                } else {
                    // Cas de l'activation 2FA (pas de token retourné)
                    toast.success('Code 2FA vérifié avec succès');
                }
            } else {
                toast.error('Code incorrect. Veuillez réessayer.');
            }
        } catch (error) {
            console.error('Erreur lors de la vérification du code 2FA:', error);
            if (!error.response) {
                toast.error('Le service de vérification 2FA n\'est pas disponible pour le moment.');
            } else if (error.response?.status === 400) {
                toast.error('Code incorrect. Veuillez réessayer.');
            } else if (error.response?.status === 401) {
                toast.error('Token invalide. Veuillez vous reconnecter.');
                handleBack();
            } else {
                toast.error('Erreur lors de la vérification du code 2FA');
            }
        } finally {
            setIsVerifying2FA(false);
        }
    };

    const handleCodeChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setVerificationCode(value);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            verify2FACode();
        }
    };

    const handleBack = () => {
        setIs2FARequired(false);
        setVerificationCode('');
        setLoginToken('');
    };

    const handleSwitchToRegister = () => {
        onClose(); // Close the current modal
        onSwitchToRegister(); // Open the register modal
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}> {/* Empêche la fermeture quand on clique sur le contenu */}
                <button className="modal-close-btn" onClick={onClose}>&times;</button>

                {!is2FARequired ? (
                    // Formulaire de connexion normal
                    <>
                        <h2>Connexion</h2>

                        {apiError && (
                            <div className="error-message api-error">
                                {apiError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="login-email">Email</label>
                                <input
                                    type="email"
                                    id="login-email"
                                    placeholder="Votre email"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    required
                                    className={errors.identifier ? 'error' : ''}
                                    disabled={isLoading}
                                />
                                {errors.identifier && <span className="error-message">{errors.identifier}</span>}
                            </div>
                            <div className="form-group">
                                <label htmlFor="login-password">Mot de passe</label>
                                <input
                                    type="password"
                                    id="login-password"
                                    placeholder="Votre mot de passe"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className={errors.password ? 'error' : ''}
                                    disabled={isLoading}
                                />
                                {errors.password && <span className="error-message">{errors.password}</span>}
                            </div>
                            <button type="submit" className="btn primary" disabled={isLoading}>
                                {isLoading ? 'Connexion en cours...' : 'Se connecter'}
                            </button>
                        </form>
                        <p className="modal-link">Pas encore de compte ? <a href="#" onClick={handleSwitchToRegister}>S'inscrire</a></p>
                    </>
                ) : (
                    // Interface de vérification 2FA
                    <div className="verification-section">
                        <h2>Authentification à deux facteurs</h2>
                        <p>Entrez le code à 6 chiffres généré par votre application d'authentification :</p>

                        <div className="code-input-container">
                            <input
                                type="text"
                                value={verificationCode}
                                onChange={handleCodeChange}
                                onKeyDown={handleKeyDown}
                                placeholder="000000"
                                className="code-input"
                                maxLength={6}
                                autoFocus
                                style={{
                                    width: '200px',
                                    padding: '15px',
                                    fontSize: '24px',
                                    textAlign: 'center',
                                    border: '2px solid #ddd',
                                    borderRadius: '8px',
                                    margin: '20px 0',
                                    letterSpacing: '5px'
                                }}
                            />
                        </div>

                        <div className="verification-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button
                                className="btn secondary"
                                onClick={handleBack}
                                style={{
                                    padding: '10px 20px',
                                    border: '2px solid #ccc',
                                    background: 'white',
                                    borderRadius: '5px',
                                    cursor: 'pointer'
                                }}
                            >
                                Retour
                            </button>
                            <button
                                className="btn primary"
                                onClick={verify2FACode}
                                disabled={isVerifying2FA || verificationCode.length !== 6}
                                style={{
                                    padding: '10px 20px',
                                    border: 'none',
                                    background: verificationCode.length === 6 ? '#007bff' : '#ccc',
                                    color: 'white',
                                    borderRadius: '5px',
                                    cursor: verificationCode.length === 6 ? 'pointer' : 'not-allowed'
                                }}
                            >
                                {isVerifying2FA ? 'Vérification...' : 'Vérifier'}
                            </button>
                        </div>

                        <div className="help-text" style={{ marginTop: '20px', color: '#666', fontSize: '14px' }}>
                            <p>💡 Le code change toutes les 30 secondes. Assurez-vous d'utiliser le code le plus récent.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginModal;
