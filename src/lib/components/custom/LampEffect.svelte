<script lang="ts">
    import { cn } from "$lib/utils";
    import { onMount } from "svelte";
    import { cubicIn } from "svelte/easing";
    import { fade } from "svelte/transition";

    let { class: clazz, delay, duration = 500 }: { class?: string; delay?: number; duration?: number } = $props();

    let show = $state(false);

    onMount(() => {
        setTimeout(() => {
            show = true;
        }, 600);
    });
</script>

{#if show}
    <div
        in:fade={{ duration, easing: cubicIn, delay }}
        class={cn(
            "pointer-events-none absolute inset-auto h-36 w-[30rem] translate-y-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 opacity-50 blur-3xl",
            clazz,
        )}>
    </div>
{/if}
