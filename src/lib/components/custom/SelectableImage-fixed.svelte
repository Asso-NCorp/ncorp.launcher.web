<script lang="ts">
    // Props
    const {
        src,
        alt = "",
        selected = false,
        aspectRatio = "square",
        onToggle = undefined,
    } = $props<{
        src: string;
        alt?: string;
        selected?: boolean;
        aspectRatio?: "square" | "video";
        onToggle?: (selected: boolean) => void;
    }>();

    // State
    let hovering = $state(false);

    // Computed
    const aspectClass = $derived(aspectRatio === "square" ? "aspect-square" : "aspect-video");

    // Methods
    function handleToggle(e: MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        if (onToggle) {
            onToggle(!selected);
        }
    }

    // Process the src to ensure it's a valid URL
    let processedSrc = "";
    $effect(() => {
        if (!src) {
            processedSrc = "/img/not_found.webp";
            return;
        }

        // If it's already a data URL or absolute URL, use it directly
        if (src.startsWith("data:") || src.startsWith("http") || src.startsWith("/")) {
            processedSrc = src;
            return;
        }

        // Otherwise, assume it's an IGDB image ID
        processedSrc = src;
    });
</script>

<div
    class="relative overflow-hidden rounded-md border {aspectClass} cursor-pointer {selected
        ? 'ring-2 ring-primary'
        : 'hover:bg-muted/10'}"
    on:mouseenter={() => (hovering = true)}
    on:mouseleave={() => (hovering = false)}
    on:click={handleToggle}>
    <img
        {src}
        {alt}
        class="h-full w-full object-cover"
        on:error={(e) => {
            console.error("Image load error:", e);
            /* (e.target as HTMLImageElement).src = "/img/not_found.webp"; */
        }} />

    {#if selected || hovering}
        <div class="absolute inset-0 flex items-center justify-center bg-black/20">
            <div class="absolute right-2 top-2">
                <div class="flex size-6 items-center justify-center rounded-md bg-white">
                    {#if selected}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="text-primary">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    {/if}
                </div>
            </div>

            {#if selected}
                <p class="rounded bg-black/40 px-2 py-1 text-sm font-medium text-white">Selected</p>
            {/if}
        </div>
    {/if}

    <slot></slot>
</div>
