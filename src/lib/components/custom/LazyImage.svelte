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
        class: className,
        ...rest
    }: $$Props = $props();

    let image: HTMLImageElement | undefined = $state();
    let loaded = $state(false);
    const handleOnLoad = () => {
        loaded = true;
        if (image) image.style.cssText = style!;
        else console.error("Image not found");
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
