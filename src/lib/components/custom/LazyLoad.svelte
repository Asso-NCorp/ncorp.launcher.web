<script lang="ts">
    /**
     * LazyLoad component using Intersection Observer API
     * Renders content only when it becomes visible in the viewport
     */

    import { onMount } from "svelte";

    type TSlot = Record<string, any>;

    interface Props {
        class?: string;
        children?: any;
    }

    let { class: klazz = "", children }: Props = $props();

    let container: HTMLElement | null = $state(null);
    let isVisible = $state(false);

    onMount(() => {
        if (!container) return;

        // Create observer with a small buffer (200px) to start loading before it's fully visible
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    isVisible = true;
                    observer.unobserve(entry.target);
                }
            },
            {
                rootMargin: "200px", // Start loading 200px before the element enters viewport
            },
        );

        observer.observe(container);

        return () => {
            observer.disconnect();
        };
    });
</script>

<div bind:this={container} class={klazz}>
    {#if isVisible}
        {@render children?.()}
    {:else}
        <div class="bg-subtle/20 h-full w-full"></div>
    {/if}
</div>
