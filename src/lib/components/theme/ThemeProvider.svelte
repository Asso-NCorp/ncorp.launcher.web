<script>
  import { onMount } from "svelte";
  import { currentTheme } from "$lib/stores/themeStore";
  import { browser } from "$app/environment";

  /**
   * @typedef {Object} Props
   * @property {import('svelte').Snippet} [children]
   */
  let { children } = $props();

  // applique les variables CSS dans :root (html)
  function applyTheme() {
    if (!$currentTheme) return;

    const root = document.documentElement;

    // injecter toutes les variables CSS avec hsl()
    for (const [key, value] of Object.entries($currentTheme.cssVars)) {
      root.style.setProperty(`--${key}`, `hsl(${value})`);
    }

    // ajouter la classe css du thème
    root.className = $currentTheme.cssClass;
  }

  onMount(() => {
    if (browser) applyTheme();
  });

  $effect(() => {
    if (browser) applyTheme();
  });
</script>

{@render children?.()}
