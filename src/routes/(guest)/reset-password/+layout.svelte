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
    import type { LayoutProps } from "../$types";
    import { toast } from "svelte-sonner";
    import { onMount } from "svelte";

    let { data, children }: LayoutProps = $props();

    const detectSWUpdate = async () => {
        const registration = await navigator.serviceWorker.ready;

        registration.addEventListener("updatefound", () => {
            const newSW = registration.installing;
            newSW?.addEventListener("statechange", () => {
                if (newSW.state === "installed") {
                    toast.info(
                        "Une nouvelle version de l'application est disponible. Veuillez recharger la page pour l'appliquer.",
                        {
                            action: {
                                label: "Recharger",
                                onClick: () => {
                                    newSW.postMessage({ type: "SKIP_WAITING" });
                                    window.location.reload();
                                },
                            },
                        },
                    );
                }
            });
        });
    };

    onMount(async () => {
        await detectSWUpdate();
    });
</script>

<Lights direction="top" class="absolute top-0 block h-56 w-full dark:hidden" />

<ThemeProvider>
    <div
        class="relative z-0 mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
        <LampEffect class="absolute inset-auto h-96 w-120 translate-y-1/5" />
        {#if browser}
            <FluidSimulation />
        {/if}
        <div
            class="relative z-10 flex w-full max-w-md flex-col items-center justify-center sm:max-w-lg md:max-w-xl lg:max-w-2xl">
            {@render children()}
        </div>
    </div>
</ThemeProvider>

<Toaster />
