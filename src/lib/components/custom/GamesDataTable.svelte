<script lang="ts">
    import { Skeleton } from "../ui/skeleton";
    import { fly } from "svelte/transition";
    import { global } from "$src/lib/states/global.svelte";
    import DataTable, { type Api } from "datatables.net";
    import "datatables.net-select";
    import "datatables.net-plugins/sorting/file-size.js";

    let { games, loading }: { games: InstallableGameExtended[]; loading: boolean } = $props();
    let table: HTMLTableElement | null = null;
    let tableApi: Api<any> | null = null;

    import { onMount, onDestroy, mount } from "svelte";
    import GameActionButton from "./GameActionButton.svelte";
    import { t } from "$src/lib/translations";
    import type { InstallableGameExtended } from "$src/lib/types";

    onMount(() => {
        if (table) {
            tableApi = new DataTable(table, {
                data: games,
                searching: false,
                paging: false,
                info: false,
                columns: [
                    {
                        title: "Titre",
                        data: "title",
                        width: "15%",
                        className: "font-bold text-center relative",
                        render: (data, type, row) => {
                            if (type === "display") {
                                return `
                                <div class="absolute inset-0 bg-cover bg-center mask-linear mask-dir-to-r mask-point-to-[80%]"
                                    style="background-image: url('/api/resources/${row.cover}')">
                                </div>
                                <div class="absolute right-0 inset-y-0 w-1/2"></div>
                                <a href="/games/${row.folderSlug}" 
                                    class="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-900 
                                    hover:text-primary-600 transition-colors duration-200 z-10 
                                    text-right text-sm sm:text-base shadow-lg text-white hover:underline">
                                    ${data}
                                    <div class="absolute -bottom-1 right-0 w-0 h-px bg-current 
                                        transition-all duration-300 group-hover:w-full"></div>
                                </a>`;
                            }
                            return data;
                        },
                    },
                    { data: "genres" },
                    { data: "maxPlayers", className: "text-center" },
                    { data: "sizeGb", render: (data) => `${data} GB`, type: "file-size", className: "text-center" },
                    { data: "totalInstallations", className: "text-center" },
                    {
                        data: null,
                        defaultContent: "",
                        orderable: false,
                    },
                ],
                order: [[0, "asc"]],
                pageLength: 10,
                createdRow: (row, data, dataIndex) => {
                    // Mount GameActionButton in the last column
                    const td = row.cells[5]; // Last cell (index 5, assuming 6 columns)
                    row.className = "h-16";

                    mount(GameActionButton, {
                        target: td,
                        props: { game: data as InstallableGameExtended },
                    });
                },
            });
        }
    });

    onDestroy(() => {
        if (tableApi) {
            tableApi.destroy();
        }
    });

    $effect(() => {
        global.gamesSearchQuery;
        if (tableApi) {
            tableApi.clear();
            tableApi.rows.add(games);
            tableApi.draw();
        }
    });
</script>

<div class="h-full w-full" in:fly|global={{ x: 50, duration: 200 }}>
    {#if loading}
        <Skeleton />
    {:else}
        <table id="tbl" class="min-w-full divide-y divide-border" bind:this={table}>
            <thead class="bg-card">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">{$t("title")}</th>
                    <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">{$t("genres")}</th>
                    <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        {$t("max_players")}
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">{$t("size")}</th>
                    <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">{$t("total_installs_count")}</th>
                    <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"></th>
                </tr>
            </thead>
            <tbody class="divide-y divide-border bg-popover"></tbody>
        </table>
    {/if}
</div>

<style>
    #tbl tbody th,
    #tbl tbody td {
        padding: 8px 10px; /* e.g. change 8x to 4px here */
    }
</style>
