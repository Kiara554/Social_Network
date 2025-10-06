import apiService from '../services/apiService';

export const deletePostAndRelated = async (postId) => {
    try {
        // Supprimer le post
        await apiService.gateway.delete(`/deletebreez/${postId}`);
        console.log(`Post ${postId} supprimé avec succès.`);

        // Supprimer les likes liés au post
        await apiService.gateway.delete(`/deletebreezlike/${postId}`);
        console.log(`Likes pour le post ${postId} supprimés avec succès.`);

        // Supprimer les commentaires liés au post
        await apiService.gateway.delete(`/deletebreezcomment/${postId}`);
        console.log(`Commentaires pour le post ${postId} supprimés avec succès.`);

        // (Optionnel) Supprimer les notifications liées ?
        // await apiService.gateway.delete(`/deletenotificationbreez/${postId}`);

        return { success: true };
    } catch (error) {
        console.error("Erreur lors de la suppression complète du post :", error);
        return { success: false, error };
    }
};
