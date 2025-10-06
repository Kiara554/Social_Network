import { useState } from 'react';

// Hook personnalisé pour la validation de formulaire
const useFormValidation = () => {
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState('');

    // Fonction pour valider un email
    const isValidEmail = (email) => {
        return /\S+@\S+\.\S+/.test(email);
    };

    // Fonction pour valider un nom d'utilisateur
    const isValidUsername = (username) => {
        return /^[a-zA-Z0-9_-]+$/.test(username);
    };

    // Fonction pour mapper les erreurs API vers des messages compréhensibles
    const mapApiError = (error, context = 'general') => {
        if (error.response?.data?.error) {
            const apiErrorMsg = error.response.data.error;

            console.log("Erreur API :", apiErrorMsg);
            
            // Messages spécifiques au contexte d'inscription
            if (context === 'register') {
                switch (apiErrorMsg) {
                    case 'Email already registered':
                        return 'Cet email est déjà utilisé. Veuillez en choisir un autre ou vous connecter.';
                    case 'Username already taken':
                        return 'Ce nom d\'utilisateur est déjà pris. Veuillez en choisir un autre.';
                    case 'User already exists':
                        return 'Un utilisateur avec ces informations existe déjà.';
                    case 'Database connection failed. Please try again.':
                        return 'Erreur de connexion. Veuillez réessayer dans quelques instants.';
                    default:
                        return 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.';
                }
            }
            
            // Messages spécifiques au contexte de connexion
            if (context === 'login') {
                switch (apiErrorMsg) {
                    case 'Invalid credentials':
                        return 'Email ou mot de passe incorrect. Veuillez vérifier vos informations.';
                    case 'Database connection failed. Please try again.':
                        return 'Erreur de connexion. Veuillez réessayer dans quelques instants.';
                    case 'Account banned':
                        return 'Votre  compte est banni !! Veuillez contacter l\'administrateur (Walid) pour plus d\'informations.';
                    default:
                        return 'Une erreur est survenue lors de la connexion. Veuillez réessayer.';
                }
            }
        } 
        
        // Erreurs réseau communes
        if (error.code === 'ERR_NETWORK') {
            return 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
        } else if (error.code === 'ECONNABORTED') {
            return 'La requête a pris trop de temps. Veuillez réessayer.';
        }
        
        return 'Une erreur inattendue est survenue. Veuillez réessayer.';
    };

    // Fonction pour valider les champs d'inscription
    const validateRegisterForm = ({ username, email, password, confirmPassword }) => {
        const newErrors = {};

        // Validation nom d'utilisateur
        if (!username.trim()) {
            newErrors.username = 'Le nom d\'utilisateur est obligatoire';
        } else if (username.length < 3) {
            newErrors.username = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
        } else if (username.length > 30) {
            newErrors.username = 'Le nom d\'utilisateur ne peut pas dépasser 30 caractères';
        } else if (!isValidUsername(username)) {
            newErrors.username = 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores';
        }

        // Validation email
        if (!email.trim()) {
            newErrors.email = 'L\'email est obligatoire';
        } else if (!isValidEmail(email)) {
            newErrors.email = 'Veuillez entrer un email valide';
        }

        // Validation mot de passe
        if (!password) {
            newErrors.password = 'Le mot de passe est obligatoire';
        } else if (password.length < 6) {
            newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
        } else if (password.length > 100) {
            newErrors.password = 'Le mot de passe ne peut pas dépasser 100 caractères';
        }

        // Validation confirmation mot de passe
        if (!confirmPassword) {
            newErrors.confirmPassword = 'Veuillez confirmer votre mot de passe';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Fonction pour valider les champs de connexion
    const validateLoginForm = ({ identifier, password }) => {
        const newErrors = {};

        // Validation identifiant (email)
        if (!identifier.trim()) {
            newErrors.identifier = 'L\'email est obligatoire';
        } else if (!isValidEmail(identifier)) {
            newErrors.identifier = 'Veuillez entrer un email valide';
        }

        // Validation mot de passe
        if (!password) {
            newErrors.password = 'Le mot de passe est obligatoire';
        } else if (password.length < 1) {
            newErrors.password = 'Veuillez saisir votre mot de passe';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Fonction pour réinitialiser les erreurs
    const resetErrors = () => {
        setErrors({});
        setApiError('');
    };

    // Fonction pour définir une erreur API
    const setApiErrorMessage = (error, context = 'general') => {
        const errorMessage = mapApiError(error, context);
        setApiError(errorMessage);
    };

    return {
        errors,
        isLoading,
        apiError,
        setIsLoading,
        validateRegisterForm,
        validateLoginForm,
        resetErrors,
        setApiErrorMessage,
        isValidEmail,
        isValidUsername
    };
};

export default useFormValidation; 