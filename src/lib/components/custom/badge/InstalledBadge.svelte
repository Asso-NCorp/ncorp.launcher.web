<script lang="ts">
    import { t } from "$src/lib/translations";
    import { CheckIcon, VerifiedIcon } from "@lucide/svelte";
    import { Badge } from "../../ui/badge";
    import { cn } from "$src/lib/utils";

    let { class: klazz }: { class?: string } = $props();
</script>

<div class={cn("flex items-center", klazz)}>
    <Badge class="mt-px rounded-[var(--radius)] bg-success" variant="default">
        {$t("installed")}
        <CheckIcon class="ml-2 h-4 w-4" />
    </Badge>
</div>
