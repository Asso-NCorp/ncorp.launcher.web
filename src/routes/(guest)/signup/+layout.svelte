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
    import type { LayoutProps } from "../$types";
    import { toast } from "svelte-sonner";
    import { onMount } from "svelte";

    let { data, children }: LayoutProps = $props();
    const loginPageMessage = data.globalSettings.find((setting) => setting.key === "login_page_message")?.value;
</script>

<Lights direction="top" class="absolute top-0 block h-56 w-full dark:hidden" />

<div class="relative z-0 mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
    <LampEffect class="absolute inset-auto h-120 w-100 translate-y-1/5 " />
    <div
        class="relative z-10 flex w-full max-w-md flex-col items-center justify-center sm:max-w-lg md:max-w-xl lg:max-w-2xl">
        {#if loginPageMessage}
            <Alert.Root variant="destructive" class="relative overflow-hidden">
                <CircleAlertIcon class="size-4" />
                <Alert.Title>Oupsss..</Alert.Title>
                <Alert.Description class="z-40">{loginPageMessage}</Alert.Description>
                <img
                    src="/img/crying_cat.gif"
                    alt="Crying Cat"
                    class="absolute right-0 bottom-0 -z-10 h-24"
                    style="mask-image: linear-gradient(135deg, transparent 0%, rgba(0,0,0,0.3) 50%, transparent 100%); -webkit-mask-image: linear-gradient(135deg, transparent 0%, rgba(0,0,0,0.3) 50%, transparent 100%);" />
            </Alert.Root>
        {/if}
        {@render children()}
    </div>
</div>
