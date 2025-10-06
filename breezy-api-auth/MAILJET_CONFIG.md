# Configuration Mailjet pour l'envoi d'emails

## Variables d'environnement nécessaires

Pour activer l'envoi d'emails de bienvenue lors de l'inscription, ajoutez les variables suivantes à votre fichier `.env` :

```env
# Configuration Mailjet API
MAILJET_API_KEY=your_mailjet_api_key_here
MAILJET_SECRET_KEY=your_mailjet_secret_key_here

# Configuration de l'expéditeur (optionnel)
SENDER_NAME=Breezy App
SENDER_EMAIL=noreply@votre-domaine.com

# URL du frontend pour le lien dans l'email (optionnel)
FRONTEND_URL=http://breezy.student-project.space
```

## Comment obtenir vos clés API Mailjet

1. Connectez-vous à votre compte [Mailjet](https://www.mailjet.com)
2. Allez dans **Account Settings** > **Master API Key & Sub API key management**
3. Récupérez votre **API Key** et **Secret Key** 
4. Copiez les clés et ajoutez-les à votre fichier `.env`

## Fonctionnalités

- **Email de bienvenue automatique** : Envoyé après chaque inscription réussie
- **Template HTML personnalisé** : Email au format HTML avec design responsive
- **Gestion d'erreurs** : Les erreurs d'envoi d'email n'interrompent pas le processus d'inscription
- **Logs** : Les succès et erreurs d'envoi sont loggés dans la console
- **Authentification sécurisée** : Utilise l'authentification Basic avec API Key et Secret Key

## Structure de l'email

- **Sujet** : "Bienvenue sur Breezy App !"
- **Contenu** : Message de bienvenue personnalisé avec le nom d'utilisateur
- **CTA** : Bouton pour accéder à l'application
- **Design** : Template HTML responsive et moderne

## Notes importantes

- Si `MAILJET_API_KEY` ou `MAILJET_SECRET_KEY` ne sont pas configurées, l'envoi d'email sera ignoré mais l'inscription continuera normalement
- Les erreurs d'envoi d'email sont loggées mais n'affectent pas le processus d'inscription
- La réponse API inclut un champ `emailSent` indiquant si l'email a été envoyé avec succès
- Mailjet utilise l'authentification Basic avec encodage Base64 des clés API 