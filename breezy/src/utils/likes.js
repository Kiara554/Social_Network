import apiService from '../services/apiService';

/**
 * Récupère le nombre de likes pour un breez donné.
 * @param {string} breezId - L'ID du breez.
 * @returns {Promise<number>} - Le nombre de likes (ou 0 en cas d'erreur).
 */
export const getNbLikesForBreez = async (breezId) => {
    try {
        const res = await apiService.gateway.get(`/getnblikebreez/${breezId}`);
        return res.data.nbLikes || 0;
    } catch (err) {
        console.error(`Erreur lors de la récupération des likes pour ${breezId}:`, err);
        return 0;
    }
};
