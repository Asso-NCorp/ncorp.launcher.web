<script lang="ts">
    import { HardDrive } from "@lucide/svelte";
    import { Badge } from "../ui/badge";
    import { Card } from "../ui/card";
    import { Progress } from "../ui/progress";
    import { HumanizedSize } from "$src/lib/classes/HumanizedBytes";
    import { cn } from "$src/lib/utils";

    let {
        name,
        letter,
        usedSpace,
        totalSpace,
        class: klazz,
    }: { name: string; letter: string; usedSpace: number; totalSpace: number; class?: string } = $props();
    let usedSpacePercent = $derived((usedSpace! / totalSpace!) * 100);
    let freeSpace = $derived(totalSpace! - usedSpace!);
</script>

<Card class={cn("flex max-w-96 items-center justify-start gap-1 rounded-lg border p-3 hover:bg-muted", klazz)}>
    <HardDrive class="mr-2 size-10 text-muted-foreground" />
    <div class="flex flex-1 flex-col gap-1">
        <h6 class="flex items-center gap-2 text-lg font-bold">
            <Badge variant="outline">{letter}</Badge>
            <span>{name}</span>
            <p class="ml-auto justify-self-end text-xs font-normal text-muted-foreground">
                {HumanizedSize.humanize(usedSpace!)} utilisés sur {totalSpace
                    ? HumanizedSize.humanize(totalSpace)
                    : "N/A"}
            </p>
        </h6>

        <Progress class="w-full" value={usedSpacePercent} max={100} min={0} color="primary" />

        <p class="ml-auto text-xs text-muted-foreground">
            Espace disponible : {HumanizedSize.humanize(freeSpace!)}
        </p>
    </div>
</Card>
