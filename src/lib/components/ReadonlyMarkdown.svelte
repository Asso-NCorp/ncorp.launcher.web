<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import type { Crepe } from "@milkdown/crepe";
    import "@milkdown/crepe/theme/common/style.css";

    const { content } = $props<{ content: string }>();

    let container: HTMLDivElement | null = null;
    let editor: Crepe | undefined;

    onMount(async () => {
        if (!container) return;
        const { Crepe } = await import("@milkdown/crepe");

        editor = new Crepe({
            root: container,
            defaultValue: content ?? "",
        });

        console.log("Creating read-only editor with content:", content);
        await editor.create();
        editor.setReadonly(true);
    });

    onDestroy(() => {
        editor?.destroy();
    });
</script>

<div class="milkdown-readonly rounded-md border p-2">
    <div bind:this={container}></div>
</div>

<style>
    :global(.milkdown .ProseMirror) {
        min-height: 120px;
        padding: 0.5rem 1rem;
    }
</style>
