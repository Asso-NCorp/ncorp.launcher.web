<script lang="ts">
    import * as Avatar from "$lib/components/ui/avatar/index.js";
    import { UserRound } from "@lucide/svelte";
    // Props
    const {
        src,
        alt = " ",
        size = 32,
        decorationSrc = undefined,
        ring = false,
        name,
        ringClass = "ring ring-primary",
        borderColor = "hsl(var(--background))",
    } = $props<{
        src: string;
        alt?: string;
        size?: number;
        name: string;
        decorationSrc?: string | undefined;
        ring?: boolean;
        ringClass?: string;
        borderColor?: string;
    }>();

    // Track image load failure
    let imgError = $state(false);

    // déco un peu plus grande, comme Discord
    const decoScale = 1.2;
    const decoSize = size * decoScale;

    // IDs uniques pour <mask>
    const rand = Math.random().toString(36).slice(2);
    const MASK_ROUND = `mask-round-${rand}`;
    const MASK_DECO = `mask-deco-${rand}`;
</script>

<div class="relative" style={`width:${size}px;height:${size}px`}>
    <!-- Avatar rond -->
    <svg {size} height={size} viewBox={`0 0 ${size} ${size}`} class="block">
        <defs>
            <mask id={MASK_ROUND}>
                <rect width={size} height={size} rx={size / 2} ry={size / 2} fill="white" />
            </mask>
        </defs>

        <foreignObject x="0" y="0" width={size} height={size} mask={`url(#${MASK_ROUND})`}>
            <div
                xmlns="http://www.w3.org/1999/xhtml"
                class={`h-full w-full overflow-hidden rounded-full border bg-background ${ring ? ringClass : ""}`}>
                {#if src && !imgError}
                    <img
                        {src}
                        {alt}
                        class="h-full w-full object-cover object-center"
                        onerror={() => (imgError = true)} />
                {:else}
                    <UserRound size={size / 2} class="absolute inset-0 m-auto" />
                {/if}
            </div>
        </foreignObject>
    </svg>

    {#if decorationSrc}
        <!-- Calque "avatar decoration" au-dessus -->
        <svg
            width={decoSize}
            height={decoSize}
            viewBox={`0 0 ${decoSize} ${decoSize}`}
            class="pointer-events-none absolute -left-[10%] -top-[10%]">
            <defs>
                <mask id={MASK_DECO}>
                    <rect width={decoSize} height={decoSize} rx={decoSize / 2} ry={decoSize / 2} fill="white" />
                </mask>
            </defs>
            <foreignObject x="0" y="0" width={decoSize} height={decoSize} mask={`url(#${MASK_DECO})`}>
                <div xmlns="http://www.w3.org/1999/xhtml" class="h-full w-full">
                    <img src={decorationSrc} alt=" " class="h-full w-full object-cover object-center" />
                </div>
            </foreignObject>
        </svg>
    {/if}
</div>
