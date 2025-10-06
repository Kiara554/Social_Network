import axios from 'axios';
import Cookies from 'js-cookie';

// Configuration des URLs d'API
const API_URLS = {
    AUTH: process.env.REACT_APP_URL_API_AUTH,
    GATEWAY: process.env.REACT_APP_URL_API_GATEWAY,
    MEDIA: process.env.REACT_APP_URL_API_MEDIA,
    SOCKET: process.env.REACT_APP_URL_SOCKET
};

// Fonction utilitaire pour construire des URLs propres
const buildUrl = (baseUrl, endpoint) => {
    const cleanBase = baseUrl?.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanEndpoint = endpoint?.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${cleanBase}${cleanEndpoint}`;
};

// Création d'une instance axios centralisée
const apiClient = axios.create({
    timeout: 10000, // 10 secondes timeout
    headers: {
        'Content-Type': 'application/json'
    }
});

// Intercepteur pour ajouter automatiquement le token à chaque requête
apiClient.interceptors.request.use(
    (config) => {
        const token = Cookies.get('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Intercepteur pour gérer les erreurs d'authentification globalement
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const requestUrl = error.config?.url || '';

            // NE PAS rediriger pour les endpoints de login/register
            const isAuthEndpoint = requestUrl.includes('/login') ||
                requestUrl.includes('/register') ||
                requestUrl.includes('/verify-2fa-code') ||
                requestUrl.includes('/generate-2fa-secret');

            if (!isAuthEndpoint) {
                // Token invalide sur une requête authentifiée, supprimer le cookie et rediriger
                Cookies.remove('authToken');
                window.location.href = '/';
            }
            // Pour les endpoints d'auth, laisser l'erreur passer normalement
        }
        return Promise.reject(error);
    }
);

// Service API centralisé
const apiService = {
    // Méthodes HTTP de base
    get: (url, config = {}) => apiClient.get(url, config),
    post: (url, data = {}, config = {}) => apiClient.post(url, data, config),
    put: (url, data = {}, config = {}) => apiClient.put(url, data, config),
    patch: (url, data = {}, config = {}) => apiClient.patch(url, data, config),
    delete: (url, config = {}) => apiClient.delete(url, config),

    // Méthodes spécifiques aux APIs
    auth: {
        get: (endpoint, config = {}) => apiClient.get(buildUrl(API_URLS.AUTH, endpoint), config),
        post: (endpoint, data = {}, config = {}) => apiClient.post(buildUrl(API_URLS.AUTH, endpoint), data, config)
    },

    gateway: {
        get: (endpoint, config = {}) => apiClient.get(buildUrl(API_URLS.GATEWAY, endpoint), config),
        post: (endpoint, data = {}, config = {}) => apiClient.post(buildUrl(API_URLS.GATEWAY, endpoint), data, config),
        put: (endpoint, data = {}, config = {}) => apiClient.put(buildUrl(API_URLS.GATEWAY, endpoint), data, config),
        patch: (endpoint, data = {}, config = {}) => apiClient.patch(buildUrl(API_URLS.GATEWAY, endpoint), data, config),
        delete: (endpoint, config = {}) => apiClient.delete(buildUrl(API_URLS.GATEWAY, endpoint), config)
    },

    // Méthode pour upload de fichiers
    upload: async (file, endpoint = '/upload') => {
        const formData = new FormData();
        formData.append('file', file);

        return fetch(buildUrl(API_URLS.MEDIA, endpoint), {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': `Bearer ${Cookies.get('authToken')}`
            }
        });
    },

    // Utilitaires
    getApiUrl: (service) => API_URLS[service.toUpperCase()],
    isOnline: () => navigator.onLine
};

export default apiService; 