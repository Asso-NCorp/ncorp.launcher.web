<script lang="ts">
    import type { FolderInfo } from "$src/lib/api/agent";
    import { cn, getLocalApi, getMachineApi } from "$src/lib/utils";
    import DiskUsageCard from "../../DiskUsageCard.svelte";
    import Separator from "../../../ui/separator/separator.svelte";
    import Input from "../../../ui/input/input.svelte";
    import DirectoryItem from "./DirectoryItem.svelte";
    import { FolderRoot } from "@lucide/svelte";
    import VirtualList from "../../virtuallist/VirtualList.svelte";

    let { path = $bindable() }: { path?: string } = $props();

    const localApi = getLocalApi();
    const machineAPi = getMachineApi();
    let folders = $state<FolderInfo[]>([]);

    // Handle directory selection
    function handleDirectorySelected(dirPath: string) {
        path = dirPath; // Update the bindable path prop
    }

    async function getFolders(pathStr?: string) {
        try {
            folders = await localApi.getFolders({ path: pathStr });
            path = pathStr;
        } catch (error) {
            console.error(error);
        }
    }

    async function getDisks() {
        try {
            // The API returns HardDriveInfo[] but we don't need to type it here
            return await machineAPi.getHardDrives();
        } catch (error) {
            console.error(error);
        }

        return [];
    }
</script>

<div class="flex w-full gap-2">
    <div>
        <h4 class="mb-2 font-bold">Sélectionner un disque</h4>
        {#await getDisks() then disks}
            <div class="flex cursor-pointer flex-col gap-2">
                {#each disks as disk}
                    <div class:bg-primary={path?.startsWith(disk.letter!)} onclick={() => getFolders(disk.letter)}>
                        <DiskUsageCard
                            class={cn({ "bg-secondary": path?.startsWith(disk.letter!) })}
                            name={disk.name!}
                            letter={disk.letter!}
                            usedSpace={disk.usedSpace!}
                            totalSpace={disk.totalSpace!} />
                    </div>
                {/each}
            </div>
        {/await}
    </div>
    <Separator orientation="vertical" class="mx-2" />

    {#if path}
        <div class="flex-1">
            <h4 class="mb-2 font-bold">Sélectionner un dossier</h4>
            <Input placeholder="Rechercher un dossier" bind:value={path} />
            <button
                disabled={!path || path.toString().endsWith(":")}
                class="w-full cursor-pointer p-0 hover:bg-muted disabled:cursor-not-allowed"
                onclick={() => {
                    if (!path || path.toString().endsWith(":")) return;

                    // Go up one directory level
                    const parentPath = path?.substring(0, path.lastIndexOf("\\"));
                    if (parentPath) getFolders(parentPath);
                }}>
                <span class="flex select-none items-center gap-2 p-1">
                    <FolderRoot class="h-4 w-4 text-blue-500" />
                    <span>..</span>
                </span>
            </button>
            <VirtualList items={folders} class="h-full max-h-96 w-full" height="20rem">
                {#snippet children(folder)}
                    <DirectoryItem
                        name={folder.name!}
                        path={folder.path!}
                        selectedPath={path}
                        onSelected={handleDirectorySelected}
                        onclick={() => getFolders(folder.path)} />
                {/snippet}
            </VirtualList>
        </div>
    {/if}
</div>
