# Système d'Authentification - Breezy [MISE À JOUR SÉCURISÉE]

## Vue d'ensemble

Le système d'authentification a été **renforcé** pour améliorer la sécurité et protéger certaines routes de l'application. Il utilise un système de tokens JWT stockés dans des cookies sécurisés et vérifie leur validité via l'API d'authentification.

## ⚠️ AMÉLIORATIONS DE SÉCURITÉ RÉCENTES

### ✅ Corrections appliquées :
- **Suppression du bypass d'authentification** dangereux en production
- **Stockage sécurisé des cookies** avec flags appropriés
- **Centralisation des requêtes API** via un service dédié
- **Gestion automatique des erreurs d'authentification**

## Architecture

### Composants principaux

1. **ApiService** (`src/services/apiService.js`) ⭐ **NOUVEAU**
   - Service centralisé pour toutes les requêtes API
   - Gestion automatique des headers d'authentification
   - Intercepteurs pour la gestion des erreurs 401
   - Configuration des timeouts

2. **AuthService** (`src/services/authService.js`) 🔒 **SÉCURISÉ**
   - Service principal pour gérer l'authentification
   - Stockage sécurisé des tokens avec flags appropriés
   - Vérification des tokens via l'API
   - **Suppression du bypass dangereux**

3. **ProtectedRoute** (`src/components/ProtectedRoute.js`)
   - Composant HOC qui protège les routes
   - Vérifie l'authentification avant d'afficher le contenu
   - Affiche un loader pendant la vérification
   - Redirige vers la page d'accueil si non authentifié

4. **useAuth Hook** (`src/hooks/useAuth.js`)
   - Hook personnalisé pour utiliser l'authentification dans les composants
   - Fournit l'état d'authentification, token, et méthodes utiles

## Configuration

### Variables d'environnement

Créez un fichier `.env` à la racine du projet avec :

```env
# URLs des API
REACT_APP_URL_API_AUTH=http://98.66.153.160:3011/api/auth
REACT_APP_URL_API_GATEWAY=http://98.66.153.160:3009/api/tasks
REACT_APP_URL_API_MEDIA=http://98.66.153.160:3010
REACT_APP_URL_SOCKET=http://98.66.153.160:3009

# ⚠️ BYPASS SUPPRIMÉ POUR LA SÉCURITÉ
# REACT_APP_BYPASS_AUTH a été supprimé pour éviter les risques de sécurité
```

### API d'authentification

L'application utilise l'endpoint suivant pour vérifier la validité des tokens :

```
GET /api/auth/is-valid-token
Authorization: Bearer <token>
```

## Utilisation

### Utiliser le service API centralisé

```jsx
import apiService from '../services/apiService';

// Requêtes vers l'API d'authentification
const response = await apiService.auth.post('/login', { identifier, password });

// Requêtes vers l'API Gateway
const posts = await apiService.gateway.get('/getallbreez');

// Upload de fichiers
const uploadResponse = await apiService.upload(file);
```

### Utiliser le service d'authentification amélioré

```jsx
import authService from '../services/authService';

// Stockage sécurisé du token
const MyComponent = () => {
    const { isAuthenticated, isLoading, logout, refreshAuth } = useAuth();

    if (isLoading) return <div>Chargement...</div>;
    
    return (
        <div>
            {isAuthenticated ? (
                <button onClick={logout}>Se déconnecter</button>
            ) : (
                <div>Non connecté</div>
            )}
        </div>
    );
};
```

### Utiliser le service directement

```jsx
import authService from './services/authService';

// Vérifier si authentifié (synchrone)
const isAuth = authService.isAuthenticated();

// Vérifier la validité du token (asynchrone)
const isValid = await authService.isValidToken();

// Déconnecter l'utilisateur
authService.logout();
```

## Types de routes

### Routes publiques
- `/` - Page d'accueil
- `/public` - Page publique d'exemple
- Toute autre route non protégée

### Routes protégées
- `/dashboard` - Dashboard principal (nécessite authentification)

## Fonctionnalités

### Bypass de développement
- Permet aux développeurs de bypasser l'authentification
- Activé via la variable `REACT_APP_BYPASS_AUTH=true`
- Affiche un avertissement dans la console

### Gestion des erreurs
- Suppression automatique des tokens invalides
- Gestion des timeouts de requête (5 secondes)
- Redirection automatique en cas d'échec d'authentification

### Loading states
- Affichage d'un loader pendant la vérification
- États de chargement disponibles via le hook `useAuth`

## Sécurité

- Les tokens sont stockés dans des cookies HTTP-only (recommandé)
- Vérification côté serveur via l'API
- Pas de traitement de token côté client
- Timeout sur les requêtes d'authentification

## Développement

Pour travailler avec le bypass activé :

1. Créer un fichier `.env` à la racine
2. Ajouter `REACT_APP_BYPASS_AUTH=true`
3. Redémarrer l'application

Les collègues peuvent ainsi continuer à travailler sans avoir besoin de tokens valides. 