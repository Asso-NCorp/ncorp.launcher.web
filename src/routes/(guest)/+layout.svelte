<script lang="ts">
    import "$src/app.css";
    import "@fontsource-variable/onest";
    import { Toaster } from "$lib/components/ui/sonner";
    import Lights from "$src/lib/components/custom/Lights.svelte";
    import "@fontsource-variable/inter";
    import ThemeProvider from "$src/lib/components/theme/ThemeProvider.svelte";
    import { browser } from "$app/environment";
    import FluidSimulation from "$src/lib/components/custom/FluidSimulation.svelte";
    import BeamsBackground from "$src/lib/components/custom/BeamsBackground.svelte";
    import type { LayoutProps } from "./$types";
    import { onMount } from "svelte";
    import { Switch } from "$lib/components/ui/switch";
    import { Label } from "$lib/components/ui/label";
    import { Zap } from "@lucide/svelte";
    
    let { data, children }: LayoutProps = $props();

    let animationsDisabled = $state(false);

    onMount(() => {
        const stored = localStorage.getItem("disableLoginAnimations");
        if (stored !== null) {
            animationsDisabled = stored === "true";
        }
    });

    function toggleAnimations() {
        animationsDisabled = !animationsDisabled;
        localStorage.setItem("disableLoginAnimations", String(animationsDisabled));
        // Dispatch custom event for nested layouts to listen
        window.dispatchEvent(new CustomEvent("animationToggle", { detail: { disabled: animationsDisabled } }));
    }
</script>


<!-- Full-screen content for table plans and other guests routes -->
<ThemeProvider>
    <BeamsBackground intensity="subtle" paused={animationsDisabled}>
        {#if !animationsDisabled}
            <Lights direction="top" class="absolute top-0 block h-56 w-full" />
        {/if}
        <!-- <Lights direction="top" class="absolute bottom-0 block h-56 w-full rotate-180" /> -->
        <div class="relative z-10 flex min-h-screen w-full flex-col">
            {#if browser && !animationsDisabled}
                <FluidSimulation />
            {/if}
            {@render children()}
        </div>
    </BeamsBackground>

    <!-- Animation toggle -->
    <div class="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-card/80 px-3 py-2 shadow-lg backdrop-blur-sm">
        <Zap class="size-4 text-muted-foreground" />
        <Label for="animations-toggle-guest" class="text-xs text-muted-foreground cursor-pointer">Animations</Label>
        <Switch id="animations-toggle-guest" checked={!animationsDisabled} onCheckedChange={toggleAnimations} />
    </div>
</ThemeProvider>

<Toaster />
