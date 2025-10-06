module.exports = (fieldsRequired) => {
    return (request, response, next) => {
        // Vérifier si request.body existe
        if (!request.body) {
            return response.status(400).json({
                error: 'Corps de la requête manquant'
            });
        }

        // Tableau pour stocker les champs manquants
        const missingFields = [];

        // Vérifie chaque champ requis
        fieldsRequired.forEach((field) => {
            if (!request.body[field]) {
                missingFields.push(field); // Ajoute le champ manquant au tableau
            }
        });

        // Si des champs sont manquants, renvoie une erreur 400
        if (missingFields.length > 0) {
            return response.status(400).json({
                error: `Les champs suivants sont requis : ${missingFields.join(', ')}` // Affiche les champs manquants
            });
        }

        next(); // Passe au middleware suivant si aucun champ n'est manquant
    };
};