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
    import CircleAlertIcon from "@lucide/svelte/icons/circle-alert";
    import * as Alert from "$lib/components/ui/alert/index.js";
    import type { LayoutProps } from "./$types";
    import { toast } from "svelte-sonner";
    import { onMount } from "svelte";

    let { data, children }: LayoutProps = $props();
    const loginPageMessage = data.globalSettings.find((setting) => setting.key === "login_page_message")?.value;

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

<!-- Contenu centré -->
<ThemeProvider>
    <div class="relative z-0 mx-auto flex min-h-screen max-w-7xl items-center justify-center">
        <LampEffect class="translate-y-1/5 absolute inset-auto h-96 w-[30rem]" />
        <!-- Contenu principal centré -->
        {#if browser}
            <FluidSimulation />
        {/if}
        <div class="relative z-10 flex max-w-md flex-col items-center justify-center">
            {#if loginPageMessage}
                <Alert.Root variant="destructive" class="relative overflow-hidden">
                    <CircleAlertIcon class="size-4" />
                    <Alert.Title>Oupsss..</Alert.Title>
                    <Alert.Description class="z-40">{loginPageMessage}</Alert.Description>
                    <img
                        src="/img/crying_cat.gif"
                        alt="Crying Cat"
                        class="absolute bottom-0 right-0 -z-10 h-24"
                        style="mask-image: linear-gradient(135deg, transparent 0%, rgba(0,0,0,0.3) 50%, transparent 100%); -webkit-mask-image: linear-gradient(135deg, transparent 0%, rgba(0,0,0,0.3) 50%, transparent 100%);" />
                </Alert.Root>
            {/if}
            {@render children()}
        </div>
    </div>
    <!-- <PseudoParticles pseudos={nicknames} /> -->
</ThemeProvider>

<Toaster />
