import Cookies from 'js-cookie';
import apiService from './apiService';

// SUPPRESSION DU BYPASS - SÉCURITÉ RENFORCÉE
// Le bypass d'authentification a été supprimé pour éviter les risques de sécurité en production

class AuthService {
    /**
     * Récupère le token depuis les cookies
     */
    getToken() {
        return Cookies.get('authToken');
    }

    /**
     * Vérifie si un token est présent
     */
    hasToken() {
        return !!this.getToken();
    }

    /**
     * Vérifie la validité du token via l'API
     */
    async isValidToken() {
        const token = this.getToken();

        if (!token) {
            return false;
        }

        try {
            const response = await apiService.auth.get('/is-valid-token');
            // Vérifier que la réponse est positive (status 200-299)
            return response.status >= 200 && response.status < 300;
        } catch (error) {
            console.error('Erreur lors de la vérification du token:', error);

            // Si le token est invalide (401), on le supprime
            if (error.response && error.response.status === 401) {
                this.removeToken();
            }

            return false;
        }
    }

    /**
     * Supprime le token des cookies de manière sécurisée
     */
    removeToken() {
        // Suppression avec les mêmes paramètres que lors de la création
        Cookies.remove('authToken', { path: '/', sameSite: 'Strict' });
        // Fallback pour s'assurer de la suppression
        Cookies.remove('authToken');
    }

    /**
     * Stockage sécurisé du token
     */
    setToken(token, days = 7) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));

        // Configuration sécurisée des cookies
        const cookieOptions = {
            expires: expires,
            path: '/',
            sameSite: 'Strict',
            secure: window.location.protocol === 'https:' // Secure uniquement en HTTPS
        };

        Cookies.set('authToken', token, cookieOptions);
    }

    /**
     * Déconnecte l'utilisateur
     */
    logout() {
        this.removeToken();
        // Rediriger vers la page d'accueil
        window.location.href = '/';
    }

    /**
     * Vérifie si l'utilisateur est authentifié (méthode synchrone)
     */
    isAuthenticated() {
        return this.hasToken();
    }

    /**
     * Méthode pour les développeurs - Affiche l'état d'authentification
     */
    getAuthStatus() {
        return {
            hasToken: this.hasToken(),
            token: this.getToken() ? 'Present' : 'Absent',
            isSecure: window.location.protocol === 'https:'
        };
    }
}

export default new AuthService(); 