<script lang="ts">
    import { browser } from "$app/environment";
    import { type HardDriveInfo, type GPUInfos, type PhysicalDevices } from "$src/lib/api/agent";
    import { type PerformanceInfos } from "$src/lib/api/agent/models/PerformanceInfos";
    import { HumanizedSize } from "$src/lib/classes/HumanizedBytes";
    import DiskUsageCard from "$src/lib/components/custom/DiskUsageCard.svelte";
    import { Badge } from "$src/lib/components/ui/badge";
    import Card from "$src/lib/components/ui/card/card.svelte";
    import Progress from "$src/lib/components/ui/progress/progress.svelte";
    import { liveAgentConnection } from "$src/lib/states/live-agent.svelte";
    import { getMachineApi } from "$src/lib/utils";
    import { HubConnectionState } from "@microsoft/signalr";
    import { logger } from "better-auth";
    import { Cpu, Fan, HardDrive, MemoryStick, Microchip } from "@lucide/svelte";
    import { onDestroy, onMount } from "svelte";

    let devices = $state<PhysicalDevices>();
    let performanceInfos = $state<PerformanceInfos | null>(null);

    if (browser) {
        liveAgentConnection.connection.off("PerformanceInfos");
        liveAgentConnection.connection.on("PerformanceInfos", (data: PerformanceInfos) => {
            performanceInfos = data;
        });
    }

    getMachineApi()
        .getPhysicalConfig()
        .then((data) => {
            devices = data;
        })
        .catch((error) => {
            logger.error("Error fetching devices", error);
        });

    onMount(() => {
        if (browser) {
            if (liveAgentConnection.connectionState === HubConnectionState.Connected) {
                liveAgentConnection.connection.invoke("StartPerformanceInfos");
            } else {
                liveAgentConnection.connection.on("Connected", () => {
                    liveAgentConnection.connection.invoke("StartPerformanceInfos");
                });
            }
        }
    });

    onDestroy(() => {
        if (browser) {
            if (liveAgentConnection.connectionState === HubConnectionState.Connected) {
                liveAgentConnection.connection.invoke("StopPerformanceInfos");
            } else {
                liveAgentConnection.connection.off("Connected");
            }

            liveAgentConnection.connection.off("PerformanceInfos");
        }
    });
</script>

<main class="flex h-full flex-col space-y-4">
    <div>
        <h5 class="text-2xl font-bold">Stockage</h5>
        <p class="text-muted-foreground">Disques durs</p>
    </div>
    <div class="flex gap-4">
        {#if devices?.hardDrives}
            {#each devices.hardDrives as drive}
                <DiskUsageCard
                    name={drive.name!}
                    letter={drive.letter!}
                    usedSpace={drive.usedSpace!}
                    totalSpace={drive.totalSpace!} />
            {/each}
        {/if}
    </div>

    <div>
        <h5 class="text-2xl font-bold">Mémoire vive</h5>
        <p class="text-muted-foreground">Utilisation de la RAM</p>
    </div>
    <div class="flex gap-4">
        {#if performanceInfos}
            <Card class="flex w-96 items-center justify-start gap-1 rounded-lg border p-3">
                <MemoryStick class="mr-2 size-10 text-muted-foreground" />
                <div class="flex flex-1 flex-col gap-1">
                    <h6 class="flex items-center gap-2 text-lg font-bold">
                        RAM
                        <p class="ml-auto justify-self-end text-xs font-normal text-muted-foreground">
                            {HumanizedSize.humanize(performanceInfos.ramUsed!)} utilisés sur {HumanizedSize.humanize(
                                performanceInfos.ramTotal!,
                            )}
                        </p>
                    </h6>

                    <Progress
                        class="w-full"
                        value={performanceInfos.ramUsedPercent}
                        max={100}
                        min={0}
                        color="primary" />
                </div>
            </Card>
        {/if}
    </div>

    <div>
        <h5 class="text-2xl font-bold">Processeur</h5>
        <p class="text-muted-foreground">Utilisation du CPU</p>
    </div>

    <div class="flex gap-4">
        {#if devices?.cpu && performanceInfos}
            <Card class="flex w-96 items-center justify-start gap-1 rounded-lg border p-3">
                <Cpu class="mr-2 size-10 text-muted-foreground" />
                <div class="flex flex-1 flex-col gap-1">
                    <h6 class="flex items-center gap-2 text-lg font-bold">
                        CPU
                        <p class="ml-auto justify-self-end text-xs font-normal text-muted-foreground">
                            {performanceInfos.cpuUsedPercent} %
                        </p>
                    </h6>
                    <p class="ml-auto text-xs text-muted-foreground">
                        {devices.cpu.name}
                    </p>
                    <Progress
                        class="w-full"
                        value={performanceInfos.cpuUsedPercent}
                        max={100}
                        min={0}
                        color="primary" />
                </div>
            </Card>
        {/if}
    </div>

    <h5 class="text-2xl font-bold">Cartes graphique</h5>
    <div class="flex gap-4">
        {#if devices?.gpUs}
            {#each devices.gpUs as gpu}
                <Card class="flex w-96 items-center justify-start gap-1 rounded-lg border p-3">
                    <Fan class="mr-2 size-10 text-muted-foreground" />
                    <div class="flex flex-1 flex-col gap-1">
                        <h6 class="flex items-center gap-2 text-lg font-bold">
                            {gpu.name}
                            <p class="ml-auto justify-self-end text-xs font-normal text-muted-foreground">
                                {HumanizedSize.humanize(gpu.vram!)}
                            </p>
                        </h6>
                    </div>
                </Card>
            {/each}
        {/if}
    </div>
</main>
