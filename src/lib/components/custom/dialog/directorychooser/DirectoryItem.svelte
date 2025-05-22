<script lang="ts">
    import { Folder } from "@lucide/svelte";
    import type { HTMLAttributes } from "svelte/elements";

    type $$Props = HTMLAttributes<HTMLDivElement> & {
        name: string;
        path: string;
        onSelected: (path: string) => void;
        selectedPath?: string;
    };

    let { name, path, onSelected, selectedPath = "", ...rest }: $$Props = $props();

    // Compute selected state based on the selectedPath prop
    let selected = $derived(selectedPath && selectedPath === path);
</script>

<div
    onclick={() => {
        // Call onSelected with this item's path
        onSelected(path);
    }}
    class:bg-muted={selected}
    class="w-full cursor-pointer select-none p-0 hover:bg-muted"
    {...rest}>
    <div class="flex w-full items-center gap-2 p-1">
        <Folder class="h-4 w-4 text-yellow-500" />
        {name}
    </div>
</div>
