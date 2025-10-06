import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/authService';

const ProtectedRoute = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const checkAuthentication = async () => {
            try {
                // Avec HttpOnly cookies, on fait directement la vérification complète avec l'API
                const isValid = await authService.isValidToken();
                setIsAuthenticated(isValid);
            } catch (error) {
                console.error('Erreur lors de la vérification de l\'authentification:', error);
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthentication();
    }, []);

    // Affichage du loader pendant la vérification
    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                flexDirection: 'column'
            }}>
                <div style={{
                    border: '4px solid #f3f3f3',
                    borderTop: '4px solid #3498db',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ marginTop: '20px', color: '#666' }}>Vérification de l'authentification...</p>
                <style>
                    {`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}
                </style>
            </div>
        );
    }

    // Si non authentifié, rediriger vers la page d'accueil
    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    // Si authentifié, afficher le contenu
    return children;
};

export default ProtectedRoute; 