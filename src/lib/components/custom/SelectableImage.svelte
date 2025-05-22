<script lang="ts">
    import { cn } from "$src/lib/utils";
    import { fly } from "svelte/transition";
    import { Checkbox } from "../ui/checkbox";

    let {
        src,
        alt,
        selected,
        onSelectChanged,
        class: klazz,
    }: {
        src: string;
        alt?: string;
        selected?: boolean;
        onSelectChanged: (selected: boolean) => void;
        class?: string;
    } = $props();

    const handleOnClick = () => {
        selected = !selected;
        onSelectChanged(selected);
    };
</script>

<div
    class="group relative overflow-hidden ring-primary transition-all duration-200 hover:ring-2 {selected &&
        'ring-2 ring-success'}">
    <img
        onclick={handleOnClick}
        {src}
        {alt}
        class={cn("h-auto w-full object-cover object-center group-hover:opacity-80", klazz)} />

    <Checkbox bind:checked={selected} class="absolute left-2 top-2" />
</div>
