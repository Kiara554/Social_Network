import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useLanguage } from '../context/LanguageContext';
import authService from '../services/authService';
import './ParametersPage.css';

const ParametersPage = ({ handleCloseParameters }) => {
    const [theme, setTheme] = useState('light');
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [currentLanguage, setCurrentLanguage] = useState('fr');
    const { language, changeLanguage, texts } = useLanguage();
    const navigate = useNavigate();

    useEffect(() => {
        // Charger les paramètres utilisateur
        loadUserSettings();
    }, []);

    const loadUserSettings = async () => {
        try {
            setIsLoading(true);
            // Avec HttpOnly cookies, plus besoin de lire le token manuellement
            // La vérification d'authentification se fait via l'API

            // Charger le thème depuis localStorage
            const savedTheme = localStorage.getItem('theme') || 'light';
            setTheme(savedTheme);
document.documentElement.setAttribute('data-theme', savedTheme);

 
            // Charger la langue depuis localStorage
            const savedLanguage = localStorage.getItem('language') || 'fr';
            setCurrentLanguage(savedLanguage);

            // TODO: Charger le statut 2FA depuis l'API
            // Pour l'instant, on utilise une valeur par défaut
            setIs2FAEnabled(false);

        } catch (error) {
            console.error('Erreur lors du chargement des paramètres:', error);
            toast.error(texts.loadingError);
        } finally {
            setIsLoading(false);
        }
    };

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    toast.success(texts.themeActivated.replace('{theme}', newTheme === 'dark' ? texts.darkTheme : texts.lightTheme));
    };

    const handleLanguageChange = (newLanguage) => {
        setCurrentLanguage(newLanguage);
        changeLanguage(newLanguage);
        toast.success(texts.languageChanged);
    };

    const handle2FAToggle = () => {
        if (is2FAEnabled) {
            // Désactiver 2FA
            toast.info('Fonctionnalité de désactivation 2FA à venir');
        } else {
            // Activer 2FA - rediriger vers la page d'activation
            navigate('/activate-2fa');
        }
    };

    const handleLogout = () => {
        authService.logout();
        toast.success(texts.logoutSuccess);
        navigate('/');
    };

    const handleClickOutside = (event) => {
        if (event.target.classList.contains('modal-overlay')) {
            handleCloseParameters();
        }
    };

    if (isLoading) {
        return (
            <div className="parameters-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>{texts.loadingParameters}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay" onClick={handleClickOutside}>
            <div className="parameters-card" onClick={(e) => e.stopPropagation()}>
                <div className="parameters-header">
                    <h1>{texts.parameters}</h1>
                    <button onClick={handleCloseParameters} className="close-modal-btn">X</button>
                    <p>{texts.managePreferences}</p>
                </div>

                <div className="parameters-sections">
                    {/* Section Apparence */}
                    <div className="parameter-section">
                        <h2>{texts.appearance}</h2>
                        <div className="parameter-item">
                            <div className="parameter-info">
                                <h3>{texts.theme}</h3>
                                <p>{texts.chooseTheme}</p>
                            </div>
                            <div className="parameter-control">
                                <div className="theme-toggle">
                                    <button
                                        className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                                        onClick={() => handleThemeChange('light')}
                                    >
                                        ☀️ {texts.lightTheme}
                                    </button>
                                    <button
                                        className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                                        onClick={() => handleThemeChange('dark')}
                                    >
                                        🌙 {texts.darkTheme}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Option de langue */}
                        <div className="parameter-item">
                            <div className="parameter-info">
                                <h3>{texts.language}</h3>
                                <p>{texts.languageSettings}</p>
                            </div>
                            <div className="parameter-control">
                                <div className="language-toggle">
                                    <button
                                        className={`language-btn ${currentLanguage === 'fr' ? 'active' : ''}`}
                                        onClick={() => handleLanguageChange('fr')}
                                    >
                                        🇫🇷 Français
                                    </button>
                                    <button
                                        className={`language-btn ${currentLanguage === 'en' ? 'active' : ''}`}
                                        onClick={() => handleLanguageChange('en')}
                                    >
                                        🇬🇧 English
                                    </button>
                                    <button
                                        className={`language-btn ${currentLanguage === 'es' ? 'active' : ''}`}
                                        onClick={() => handleLanguageChange('es')}
                                    >
                                        🇪🇸 Español
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section Sécurité */}
                    <div className="parameter-section">
                        <h2>{texts.security}</h2>
                        <div className="parameter-item">
                            <div className="parameter-info">
                                <h3>{texts.twoFactorAuth}</h3>
                                <p>{texts.secureTwoFactorText}</p>
                            </div>
                            <div className="parameter-control">
                                <button
                                    className={`toggle-btn ${is2FAEnabled ? 'enabled' : 'disabled'}`}
                                    onClick={handle2FAToggle}
                                >
                                    {is2FAEnabled ? texts.disable : texts.enable}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Section Compte */}
                    <div className="parameter-section">
                        <h2>{texts.account}</h2>
                        <div className="parameter-item">
                            <div className="parameter-info">
                                <h3>{texts.logout}</h3>
                                <p>{texts.logoutText}</p>
                            </div>
                            <div className="parameter-control">
                                <button
                                    className="logout-btn"
                                    onClick={handleLogout}
                                >
                                    {texts.logout}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParametersPage;
