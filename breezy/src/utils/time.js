import { useLanguage } from '../context/LanguageContext';

export function getTimeAgo(date) {
    // Pour permettre son utilisation en dehors d'un composant React
    try {
        const language = localStorage.getItem('language') || 'fr';
        const translations = require('../utils/translations').translations;
        const texts = translations[language];

        const now = new Date();
        const postedDate = new Date(date);
        const diffInSeconds = Math.floor((now - postedDate) / 1000);

        if (diffInSeconds < 60) return texts.timeAgo.seconds.replace('{time}', diffInSeconds);
        if (diffInSeconds < 3600) return texts.timeAgo.minutes.replace('{time}', Math.floor(diffInSeconds / 60));
        if (diffInSeconds < 86400) return texts.timeAgo.hours.replace('{time}', Math.floor(diffInSeconds / 3600));
        if (diffInSeconds < 2592000) return texts.timeAgo.days.replace('{time}', Math.floor(diffInSeconds / 86400));
        if (diffInSeconds < 31536000) return texts.timeAgo.months.replace('{time}', Math.floor(diffInSeconds / 2592000));

        return texts.timeAgo.years.replace('{time}', Math.floor(diffInSeconds / 31536000));
    } catch (error) {
        // Fallback si traductions pas disponibles
        const now = new Date();
        const postedDate = new Date(date);
        const diffInSeconds = Math.floor((now - postedDate) / 1000);

        if (diffInSeconds < 60) return `il y a ${diffInSeconds} sec`;
        if (diffInSeconds < 3600) return `il y a ${Math.floor(diffInSeconds / 60)} min`;
        if (diffInSeconds < 86400) return `il y a ${Math.floor(diffInSeconds / 3600)} h`;
        if (diffInSeconds < 2592000) return `il y a ${Math.floor(diffInSeconds / 86400)} j`;
        if (diffInSeconds < 31536000) return `il y a ${Math.floor(diffInSeconds / 2592000)} mois`;

        return `il y a ${Math.floor(diffInSeconds / 31536000)} an(s)`;
    }
}
