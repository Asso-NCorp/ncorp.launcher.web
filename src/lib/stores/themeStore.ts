// src/lib/stores/themeStore.js
import { persisted } from 'svelte-persisted-store';
import { derived } from 'svelte/store';
import { themes, defaultTheme } from '$lib/themes/themes';

// Créer un store persistant pour sauvegarder le thème dans localStorage
export const currentThemeId = persisted('theme-preference', defaultTheme);

// Store dérivé pour accéder aux données complètes du thème actuel
export const currentTheme = derived(currentThemeId, ($currentThemeId) => {
    return themes[$currentThemeId] || themes[defaultTheme];
});

// Fonction pour définir un nouveau thème
export function setTheme(themeId) {
    if (themes[themeId]) {
        currentThemeId.set(themeId);
    }
}
