-- Script pour nettoyer les doublons d'emails dans la table users
-- ⚠️ ATTENTION : Sauvegardez votre base de données avant d'exécuter ce script !

-- 1. Voir les doublons d'emails
SELECT login, COUNT(*) as count 
FROM users 
GROUP BY login 
HAVING COUNT(*) > 1;

-- 2. Voir les doublons d'usernames
SELECT username, COUNT(*) as count 
FROM users 
GROUP BY username 
HAVING COUNT(*) > 1;

-- 3. Supprimer les doublons en gardant le plus récent (avec le user_id le plus élevé)
-- Pour les emails dupliqués :
DELETE u1 FROM users u1
INNER JOIN users u2 
WHERE u1.login = u2.login 
AND u1.user_id < u2.user_id;

-- Pour les usernames dupliqués :
DELETE u1 FROM users u1
INNER JOIN users u2 
WHERE u1.username = u2.username 
AND u1.user_id < u2.user_id;

-- 4. Vérifier qu'il n'y a plus de doublons
SELECT login, COUNT(*) as count 
FROM users 
GROUP BY login 
HAVING COUNT(*) > 1;

SELECT username, COUNT(*) as count 
FROM users 
GROUP BY username 
HAVING COUNT(*) > 1;

-- 5. Ajouter les contraintes d'unicité (si pas déjà fait via le modèle)
-- ALTER TABLE users ADD CONSTRAINT unique_login UNIQUE (login);
-- ALTER TABLE users ADD CONSTRAINT unique_username UNIQUE (username); 