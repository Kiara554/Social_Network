import apiService from '../services/apiService';

export const getInfoUser = async (token) => {
    try {
        // Avec HttpOnly cookies, le token est envoyé automatiquement
        const response = await apiService.auth.get('/get-payload');

        console.log(response.data.user);
        return response.data.user;

    } catch (err) {
        console.log(err);
    }
};

let cachedUserId = null;

export const getCurrentUserId = async () => {
    if (cachedUserId) {
        return cachedUserId;
    }
    
    try {
        const response = await apiService.auth.get('/get-payload');
        cachedUserId = response.data.user.userId;
        return cachedUserId;
    } catch (error) {
        console.error('Error getting current user ID:', error);
        throw new Error('No auth token found or invalid token');
    }
};

let cachedUserName = null;

export const getCurrentUserName = async () => {
    if (cachedUserName) {
        return cachedUserName;
    }
    
    try {
        const response = await apiService.auth.get('/get-payload');
        cachedUserName = response.data.user.username;
        return cachedUserName;
    } catch (error) {
        console.error('Error getting current username:', error);
        throw new Error('No auth token found or invalid token');
    }
};

// Fonction utilitaire pour vider le cache
export const clearUserCache = () => {
    cachedUserId = null;
    cachedUserName = null;
};

