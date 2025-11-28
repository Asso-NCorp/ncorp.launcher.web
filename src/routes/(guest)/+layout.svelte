<script lang="ts">
    import "$src/app.css";
    import "@fontsource-variable/rubik";
    import { Toaster } from "$lib/components/ui/sonner";
    import LampEffect from "$src/lib/components/custom/LampEffect.svelte";
    import Lights from "$src/lib/components/custom/Lights.svelte";
    import "@fontsource-variable/inter";
    import ThemeProvider from "$src/lib/components/theme/ThemeProvider.svelte";
    import { browser } from "$app/environment";
    import FluidSimulation from "$src/lib/components/custom/FluidSimulation.svelte";
    import type { LayoutProps } from "./$types";
    import { toast } from "svelte-sonner";
    import { onMount } from "svelte";

    let { data, children }: LayoutProps = $props();
</script>


<!-- Full-screen content for table plans and other guests routes -->
<ThemeProvider>
    <Lights direction="top" class="absolute top-0 block h-56 w-full" />
    <Lights direction="top" class="absolute bottom-0 block h-56 w-full rotate-180" />
    <div class="relative z-0 flex min-h-screen w-full flex-col">
        {#if browser}
            <FluidSimulation />
        {/if}
        {@render children()}
    </div>
</ThemeProvider>

<Toaster />
