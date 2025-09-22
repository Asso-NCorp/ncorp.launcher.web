<script lang="ts" module>
    import type { WithElementRef } from "bits-ui";
    import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";
    import { type VariantProps, tv } from "tailwind-variants";
    import type { Icon as IconType } from "@lucide/svelte";
    export const buttonVariants = tv({
        base: "ring-offset-background focus-visible:ring-ring inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
				destructive:
					"bg-red-500 shadow-xs hover:bg-red-600 focus-visible:ring-red-500/20 dark:focus-visible:ring-red-500/40 dark:bg-red-500/60 text-white",
				outline:
					"bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 border",
				secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
				ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
				link: "text-primary underline-offset-4 hover:underline",
                success: "bg-green-500 text-white hover:bg-green-600",
                info: "bg-sky-500 text-white hover:bg-sky-600",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-11 rounded-md px-8",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    });

    export type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
    export type ButtonSize = VariantProps<typeof buttonVariants>["size"];

    export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
        WithElementRef<HTMLAnchorAttributes> & {
            variant?: ButtonVariant;
            size?: ButtonSize;
            isLoading?: boolean;
            icon?: typeof IconType | (() => typeof IconType) | undefined;
        };
</script>

<script lang="ts">
    import { cn } from "$lib/utils.js";
    import Loader from "../../custom/Loader.svelte";

    let {
        class: className,
        variant = "default",
        size = "default",
        ref = $bindable(null),
        href = undefined,
        type = "button",
        isLoading,
        icon: Icon,
        children,
        ...restProps
    }: ButtonProps = $props();
</script>

{#if href}
    <a bind:this={ref} class={cn(buttonVariants({ variant, size }), className)} {href} {...restProps}>
        {@render children?.()}
    </a>
{:else}
    <button
        inert={isLoading}
        bind:this={ref}
        class={cn(buttonVariants({ variant, size }), className, "transition-transform duration-200")}
        {type}
        {...restProps}>
        <div class="flex items-center gap-2">
            {#if isLoading}
                <Loader size={16}/>
            {:else if Icon}
                <Icon />
            {/if}
            {@render children?.()}
        </div>
    </button>
{/if}
