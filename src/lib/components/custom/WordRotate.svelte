<script lang="ts">
    import { cn } from "$lib/utils";
    import { fly } from "svelte/transition";

    export let word: string = "";
    let className: string = "";
    export { className as class };
</script>

<div class="overflow-hidden py-2">
    {#key word}
        <h1 in:fly={{ y: -50, delay: 200 }} out:fly={{ y: 40, duration: 200 }} class={cn(className, "text-center")}>
            {word}
        </h1>
    {/key}
</div>
