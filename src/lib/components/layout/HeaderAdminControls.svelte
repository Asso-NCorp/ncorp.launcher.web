<script lang="ts">
    import { buttonVariants } from "../ui/button";
    import { Settings } from "@lucide/svelte";

    let { onclick }: { onclick: () => void } = $props();
</script>

<!-- Simple button to open admin modal -->
<div class="flex h-full w-auto gap-1 border-l">
    <div class="flex flex-1 flex-col items-start justify-center">
        <button class={buttonVariants({ variant: "ghost" })} {onclick}>
            <Settings class="mr-2 h-4 w-4" />
            Admin Controls
        </button>
    </div>
</div>
