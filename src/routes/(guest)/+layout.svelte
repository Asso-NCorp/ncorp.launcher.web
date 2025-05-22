<script lang="ts">
    import "$src/app.css";
    import "@fontsource-variable/rubik";
    import { onMount, type Snippet } from "svelte";
    import { Toaster } from "$lib/components/ui/sonner";
    import LampEffect from "$src/lib/components/custom/LampEffect.svelte";
    import Lights from "$src/lib/components/custom/Lights.svelte";
    import "@fontsource-variable/inter";
    import ThemeProvider from "$src/lib/components/theme/ThemeProvider.svelte";
    import { browser } from "$app/environment";
    import FluidSimulation from "$src/lib/components/custom/FluidSimulation.svelte";
    let { children }: { children: Snippet } = $props();

    onMount(() => {});
</script>

<Lights direction="top" class="absolute top-0 block h-56 w-full dark:hidden" />

<!-- Contenu centré -->
<ThemeProvider>
    <div class="relative z-0 mx-auto flex min-h-screen max-w-7xl items-center justify-center">
        <LampEffect class="translate-y-1/5 absolute inset-auto h-96 w-[30rem]" />
        <!-- Contenu principal centré -->
        {#if browser}
            <FluidSimulation />
        {/if}
        <div class="relative z-10 flex items-center justify-center">
            {@render children()}
        </div>
    </div>
    <!-- <PseudoParticles pseudos={nicknames} /> -->
</ThemeProvider>

<Toaster />
