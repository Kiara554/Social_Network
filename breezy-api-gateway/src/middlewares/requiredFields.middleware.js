const {request, response} = require("express");
module.exports = (fieldsRequired) => {
    return (request, response, next) => {
        // Tableau pour stocker les champs manquants
        const missingFields = [];

        // Vérifie chaque champ requis
        fieldsRequired.forEach((field) => {
            if (!request.body[field]) {
                missingFields.push(field);
            }
        });

        // Si des champs sont manquants, renvoie une erreur 400
        if (missingFields.length > 0) {
            return response.status(400).json({
                error: `Les champs suivants sont requis : ${missingFields.join(', ')}`, // Affiche les champs manquants
            })
        }

        next();

    };
};
