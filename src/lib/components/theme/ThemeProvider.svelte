<script>
    import { run } from "svelte/legacy";

    import { onMount } from "svelte";
    import { currentTheme } from "$lib/stores/themeStore";
    import { browser } from "$app/environment";
    /**
     * @typedef {Object} Props
     * @property {import('svelte').Snippet} [children]
     */

    /** @type {Props} */
    let { children } = $props();

    let style = $state("");

    // Créer la chaîne CSS avec les variables du thème actuel
    $effect.pre(() => {
        if ($currentTheme) {
            const cssVars = Object.entries($currentTheme.cssVars)
                .map(([key, value]) => `--${key}: ${value}`)
                .join(";");
            style = cssVars;
        }
    });

    onMount(() => {
        if (browser) {
            applyTheme();
        }
    });

    $effect(() => {
        if (browser) {
            applyTheme();
        }
    });

    function applyTheme() {
        // Appliquer les variables CSS directement au niveau de :root
        document.documentElement.setAttribute("style", style);
    }
</script>

{@render children?.()}
