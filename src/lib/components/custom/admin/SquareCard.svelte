<script lang="ts">
    import { cn } from "$src/lib/utils";
    import type { Snippet } from "svelte";
    import CardBody from "./CardBody.svelte";
    import CardIcon from "./CardIcon.svelte";

    let { class: klazz, classBody, children }: { class?: string; classBody?: string; children?: Snippet } = $props();
</script>

<div class={cn("relative border border-dashed [border-radius:var(--radius)]", klazz)}>
    <CardIcon class="-left-3 -top-3" />
    <CardIcon class="-right-3 -top-3" />
    <CardIcon class="-bottom-3 -left-3" />
    <CardIcon class="-bottom-3 -right-3" />
    <CardBody class={cn(classBody, "p-2")}>
        {@render children?.()}
    </CardBody>
</div>
