<script lang="ts">
    import { CheckCheckIcon } from "@lucide/svelte";
    import { Badge } from "../../ui/badge";
    import { cn } from "$src/lib/utils";

    let { class: klazz }: { class?: string } = $props();
</script>

<div class={cn("flex items-center", klazz)}>
    <Badge class="mt-px rounded-(--radius) bg-success py-1" variant="default">
        <CheckCheckIcon class="h-4 w-4" />
    </Badge>
</div>
