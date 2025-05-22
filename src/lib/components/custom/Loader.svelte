<script lang="ts">
    import { cn } from "$src/lib/utils";
    import SvgSpinnersRingResize from "../icons/SvgSpinnersRingResize.svelte";

    let {
        size,
        class: klazz,
    }: {
        size?: number;
        class?: string;
    } = $props();
</script>

<SvgSpinnersRingResize width={size} height={size} class={cn(`animate-spin text-primary dark:text-secondary`, klazz)} />
