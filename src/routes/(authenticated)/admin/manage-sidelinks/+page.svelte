<script lang="ts">
    import BlurFade from "$src/lib/components/custom/BlurFade.svelte";
    import type { PageData } from "./$types";
    import SidelinkList from "$src/lib/components/custom/admin/SidelinkList.svelte";
    import AddSidelinkForm from "./add-sidelink-form.svelte";
    import EditSidelinkForm from "./edit-sidelink-form.svelte";
    import { onMount } from "svelte";
    import type { sidelink } from "@prisma/client";
    import { liveServerConnection } from "$src/lib/states/live-server.svelte";
    import { global } from "$src/lib/states/global.svelte";

    let { data }: { data: PageData } = $props();
    let selectedSidelink: sidelink | null = $state(null);

    // Handle delete action
    async function handleDelete(sidelink: sidelink) {
        const formData = new FormData();
        formData.append("id", sidelink.id.toString());

        const response = await fetch("?/delete", {
            method: "POST",
            body: formData,
        });

        if (response.ok) {
            await liveServerConnection.broadcastMessage("SideLinksUpdated");
        } else {
            console.error("Failed to delete sidelink");
        }
    }

    // Listen for clearSelection event
    onMount(() => {
        const handleClearSelection = () => {
            selectedSidelink = null;
        };

        document.addEventListener("clearSelection", handleClearSelection);

        return () => {
            document.removeEventListener("clearSelection", handleClearSelection);
        };
    });
</script>

<main class="flex h-full flex-col space-y-4">
    <BlurFade delay={0.3} class="text-3xl font-bold">Gestion des liens</BlurFade>
    <div class="grid grid-cols-3 gap-8">
        <div class="col-span-1">
            <SidelinkList
                sidelinks={global.sideLinks}
                loading={false}
                onSelect={(sidelink: sidelink) => (selectedSidelink = sidelink)}
                onDelete={handleDelete} />
        </div>

        <div class="col-span-2">
            {#if selectedSidelink}
                <EditSidelinkForm data={{ editForm: data.editForm }} sidelink={selectedSidelink} />
            {:else}
                <AddSidelinkForm data={{ addForm: data.addForm }} />
            {/if}
        </div>
    </div>
</main>
