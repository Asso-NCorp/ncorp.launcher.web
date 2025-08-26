<script lang="ts">
    import type { Icon as IconType } from "@lucide/svelte";

    let {
        active = false,
        label = "",
        imageUrl = "",
        icon,
        text = "",
        notifications = 0 as number | boolean,
        size = 48,
        disabled = false,
        // collect any additional props (including onclick passed by parent)
        ...restProps
    }: {
        active?: boolean;
        label?: string;
        imageUrl?: string;
        icon?: typeof IconType | undefined;
        text?: string;
        notifications?: number | boolean;
        size?: number;
        disabled?: boolean;
        [rest: string]: any;
    } = $props();

    const showBadge = () => !!notifications;
    const badgeText = () =>
        typeof notifications === "number" ? (notifications > 99 ? "99+" : notifications.toString()) : "";
</script>

<button
    type="button"
    aria-pressed={active}
    aria-label={label}
    {disabled}
    style={`width:${size}px;height:${size}px;`}
    class="group relative flex items-center justify-center overflow-hidden rounded-[1.4rem] p-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 disabled:cursor-not-allowed disabled:opacity-50 {active
        ? 'bg-primary/20 ring-2 ring-primary'
        : 'bg-muted/40 hover:rounded-2xl hover:bg-muted/70'}"
    {...restProps}>
    {#if imageUrl}
        <img src={imageUrl} alt={label} class="block h-full w-full object-cover" loading="lazy" />
    {:else if icon}
        <svelte:component this={icon} size={Math.round(size * 0.62)} class="block" />
    {:else if text}
        <span class="select-none text-sm font-semibold leading-none">{text}</span>
    {/if}

    {#if active}
        <span
            class="absolute left-0 top-1/2 h-8 w-1 -translate-x-2 -translate-y-1/2 rounded-r bg-primary transition-all" />
    {:else}
        <span
            class="pointer-events-none absolute left-0 top-1/2 h-4 w-1 -translate-x-2 -translate-y-1/2 rounded-r bg-primary/50 opacity-0 transition-all group-hover:opacity-100" />
    {/if}

    {#if showBadge()}
        <span
            class="pointer-events-none absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground shadow-md"
            data-has-text={typeof notifications === "number"}>
            {#if typeof notifications === "number"}{badgeText()}{/if}
        </span>
    {/if}
</button>

<style>
    [data-has-text="false"] {
        width: 10px;
        height: 10px;
        padding: 0;
    }
</style>
