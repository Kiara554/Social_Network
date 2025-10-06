import React, { useState, useEffect } from 'react';
import apiService from './services/apiService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import QRCode from 'qrcode';
import authService from './services/authService';
import './Activate2faPage.css';

const Activate2faPage = () => {
    const [qrCode, setQrCode] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isVerifying, setIsVerifying] = useState(false);
    const [step, setStep] = useState(1); // 1: QR Code, 2: Verification
    const navigate = useNavigate();

    const API_BASE_URL = `${process.env.REACT_APP_URL_API_AUTH || '98.66.153.160:3011/api/auth/'}`;

    useEffect(() => {
        generate2FASecret();
    }, []);

    const generate2FASecret = async () => {
        try {
            setIsLoading(true);
                    // Avec HttpOnly cookies, on vérifie l'auth via l'API
        try {
            const isValid = await authService.isValidToken();
            if (!isValid) {
                toast.error('Vous devez être connecté pour activer 2FA.');
                navigate('/');
                return;
            }
        } catch (error) {
            toast.error('Vous devez être connecté pour activer 2FA.');
            navigate('/');
            return;
        }

            // Avec HttpOnly cookies, le token est envoyé automatiquement
            const response = await apiService.auth.post('/generate-2fa-secret', {});

            if (response.data.success) {
                const qrCodeUrl = await QRCode.toDataURL(response.data.qrCode);
                setQrCode(qrCodeUrl);
                setSecretKey(response.data.secretKey);
                setStep(1);
            } else {
                console.error('Erreur serveur:', response.data.error);
                toast.error(`Erreur lors de la génération du secret 2FA: ${response.data.error}`);
            }
        } catch (error) {
            console.error('Erreur lors de la génération du secret 2FA:', error);
            if (!error.response) {
                toast.error('Le service 2FA n\'est pas disponible pour le moment.');
            } else {
                toast.error(`Erreur lors de la génération du secret 2FA: ${error.message}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const verify2FACode = async () => {
        if (!verificationCode || verificationCode.length !== 6) {
            toast.error('Veuillez entrer un code à 6 chiffres');
            return;
        }

        try {
            setIsVerifying(true);
            // Avec HttpOnly cookies, on vérifie l'auth via l'API
            try {
                const isValid = await authService.isValidToken();
                if (!isValid) {
                    toast.error('Vous devez être connecté pour vérifier le code 2FA.');
                    navigate('/');
                    return;
                }
            } catch (error) {
                toast.error('Vous devez être connecté pour vérifier le code 2FA.');
                navigate('/');
                return;
            }

            // Avec HttpOnly cookies, le token est envoyé automatiquement
            const response = await apiService.auth.post('/verify-2fa-code', {
                code: verificationCode,
                secretKey: secretKey
            });

            if (response.data.success) {
                toast.success('Authentification à deux facteurs activée avec succès !');
                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);
            } else {
                toast.error('Code incorrect. Veuillez réessayer.');
            }
        } catch (error) {
            console.error('Erreur lors de la vérification du code 2FA:', error);
            if (!error.response) {
                toast.error('Le service de vérification 2FA n\'est pas disponible pour le moment.');
            } else if (error.response?.status === 400) {
                toast.error('Code incorrect. Veuillez réessayer.');
            } else {
                toast.error('Erreur lors de la vérification du code 2FA');
            }
        } finally {
            setIsVerifying(false);
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

    if (isLoading) {
        return (
            <div className="activate-2fa-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Génération du QR code...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="activate-2fa-container">
            <div className="activate-2fa-card">
                <div className="activate-2fa-header">
                    <h1>Activer l'authentification à deux facteurs</h1>
                    <p>Sécurisez votre compte avec l'authentification à deux facteurs</p>
                </div>

                {step === 1 && (
                    <div className="qr-code-section">
                        <div className="qr-code-container">
                            <h3>Étape 1 : Scannez le QR code</h3>
                            <p>Utilisez votre application d'authentification (Google Authenticator, Authy, etc.) pour scanner ce QR code :</p>
                            
                            {qrCode && (
                                <div className="qr-code-wrapper">
                                    <img 
                                        src={qrCode} 
                                        alt="QR Code pour 2FA" 
                                        className="qr-code-image"
                                    />
                                </div>
                            )}

                            <div className="secret-key-section">
                                <h4>Clé secrète (si le QR code ne fonctionne pas) :</h4>
                                <div className="secret-key-display">
                                    <code>{secretKey}</code>
                                    <button 
                                        className="copy-button"
                                        onClick={() => {
                                            navigator.clipboard.writeText(secretKey);
                                            toast.success('Clé secrète copiée !');
                                        }}
                                    >
                                        Copier
                                    </button>
                                </div>
                            </div>

                            <div className="instructions">
                                <h4>Instructions :</h4>
                                <ol>
                                    <li>Téléchargez une application d'authentification si vous n'en avez pas</li>
                                    <li>Scannez le QR code avec votre application</li>
                                    <li>Une fois le code ajouté, cliquez sur "Continuer"</li>
                                </ol>
                            </div>

                            <button 
                                className="btn-primary"
                                onClick={() => setStep(2)}
                            >
                                Continuer
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="verification-section">
                        <div className="verification-container">
                            <h3>Étape 2 : Vérifiez le code</h3>
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
                                />
                            </div>

                            <div className="verification-actions">
                                <button 
                                    className="btn-secondary"
                                    onClick={() => setStep(1)}
                                >
                                    Retour
                                </button>
                                <button 
                                    className="btn-primary"
                                    onClick={verify2FACode}
                                    disabled={isVerifying || verificationCode.length !== 6}
                                >
                                    {isVerifying ? 'Vérification...' : 'Vérifier et activer'}
                                </button>
                            </div>

                            <div className="help-text">
                                <p>💡 Le code change toutes les 30 secondes. Assurez-vous d'utiliser le code le plus récent.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Activate2faPage;
