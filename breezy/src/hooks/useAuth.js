import { useState, useEffect } from 'react';
import authService from '../services/authService';

const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [token, setToken] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Avec HttpOnly cookies, on ne peut plus lire le token directement
                // On utilise isValidToken pour vérifier l'authentification
                const isValid = await authService.isValidToken();
                setIsAuthenticated(isValid);
                setToken(isValid ? 'valid' : null);
            } catch (error) {
                console.error('Erreur lors de la vérification de l\'authentification:', error);
                setIsAuthenticated(false);
                setToken(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    const logout = () => {
        authService.logout();
        setIsAuthenticated(false);
        setToken(null);
    };

    const refreshAuth = async () => {
        setIsLoading(true);
        try {
            // Avec HttpOnly cookies, on ne peut plus lire le token directement
            const isValid = await authService.isValidToken();
            setIsAuthenticated(isValid);
            setToken(isValid ? 'valid' : null);
        } catch (error) {
            console.error('Erreur lors du rafraîchissement de l\'authentification:', error);
            setIsAuthenticated(false);
            setToken(null);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isAuthenticated,
        isLoading,
        token,
        logout,
        refreshAuth
    };
};

export default useAuth; 