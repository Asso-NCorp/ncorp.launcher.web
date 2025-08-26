<script lang="ts">
    import type { Snippet } from "svelte";
    import Loader from "./Loader.svelte";
    import type { HTMLAttributes } from "svelte/elements";

    type $$Props = HTMLAttributes<HTMLImageElement> & {
        src?: string;
        alt?: string;
        imageWidth?: string;
        imageHeight?: string;
        placeholderWidth?: string;
        placeholderHeight?: string;
        children?: Snippet;
        fallbackSrc?: string; // new
    };

    let {
        src = "",
        alt = "image",
        imageWidth = "100%",
        imageHeight = "",
        placeholderWidth = "100%",
        placeholderHeight = "400px",
        style = "",
        children,
        fallbackSrc = "/img/not_found.webp", // new
        class: className,
        ...rest
    }: $$Props = $props();

    let image: HTMLImageElement | undefined = $state();
    let loaded = $state(false);
    const handleOnLoad = (ev: Event) => {
        loaded = true;
        if (image) image.style.cssText = style!;
        else console.error("Image not found");
    };
    // new: handle error (e.g., 404) and swap to fallback
    const handleError = () => {
        if (!image) return;
        // If not already using fallback, try it
        if (!image.src.endsWith(fallbackSrc)) {
            loaded = false;
            image.src = fallbackSrc;
            return;
        }
        // Fallback also failed; stop spinner
        loaded = true;
    };
</script>

{#key src}
    <img
        {...rest}
        width={placeholderWidth}
        height={placeholderHeight}
        class={className}
        {src}
        {alt}
        onloadstart={() => (loaded = false)}
        onload={handleOnLoad}
        onerror={handleError}
        bind:this={image}
        style="display: none" />
    <div class="pointer-events-none absolute flex h-full w-full items-center justify-center">
        {#if !loaded}
            {#if children}
                {@render children()}
            {:else}
                <Loader size={16} class="z-20" />
            {/if}
        {/if}
    </div>
{/key}
