<script lang="ts">
    import { Skeleton } from "$src/lib/components/ui/skeleton";
    import { GamesStore } from "$src/lib/states/games.svelte";
    import type { InstallableGame } from "$src/lib/shared-models";
    import DataTable, { type Api } from "datatables.net";
    import { onMount, onDestroy, mount } from "svelte";
    import DeleteGameButton from "$src/lib/components/custom/DeleteGameButton.svelte";

    let { gameSelected }: { gameSelected: (game: InstallableGame) => void } = $props();

    let tableEl: HTMLTableElement | null = null;
    let tableApi: Api<any> | null = null;

    // Apply global search input classes once (must be before any DataTable() call)
    if ((DataTable as any)?.ext?.classes) {
        DataTable.ext.classes.search.input =
            "!flex !h-10 !w-96 !rounded-md !border !border-input !bg-background-darker !px-3 !py-2 !text-base !ring-offset-background file:!border-0 file:!bg-transparent file:!text-sm file:!font-medium placeholder:!text-muted-foreground focus-visible:!outline-none focus-visible:!ring-2 focus-visible:!ring-ring focus-visible:!ring-offset-2 disabled:!cursor-not-allowed disabled:!opacity-50 md:!text-sm";
    }

    onMount(() => {
        if (!tableEl) return;
        if (tableApi) return;
        tableApi = new DataTable(tableEl, {
            data: GamesStore.games,
            searching: true,
            paging: false,
            info: false,
            language: { search: "Rechercher..." },
            columns: [
                {
                    title: "Titre",
                    data: "title",
                    width: "80%",
                    className: "relative font-bold h-16 cursor-pointer",
                    render: (data, type, row) => {
                        if (type === "display") {
                            return `
								<div class="absolute inset-0 w-2/3 bg-cover bg-center mask-linear mask-dir-to-r mask-point-to-[80%]"
									style="background-image:url('/api/resources/${row.cover}')"></div>
								<div class="absolute inset-y-0 right-0 w-1/2"></div>
								<span
									data-folder="${row.folderSlug}"
									class="select-game absolute right-4 top-1/2 -translate-y-1/2 z-10 text-right text-sm sm:text-base font-bold shadow-lg hover:underline hover:text-primary-600 transition-colors duration-200">
									${data}
								</span>
							`;
                        }
                        return data;
                    },
                },
                {
                    title: "",
                    data: null,
                    orderable: false,
                    className: "text-right align-middle",
                    render: () => "",
                },
            ],
            order: [[0, "asc"]],
            createdRow: (row, data: InstallableGame) => {
                // Mount the delete button Svelte component into last cell
                const td = row.cells[1];
                mount(DeleteGameButton, {
                    target: td,
                    props: { game: data },
                });
            },
            rowCallback: (row: HTMLTableRowElement, data: InstallableGame) => {
                const firstCell = row.cells[0];
                if (firstCell && !firstCell.dataset.selectBound) {
                    firstCell.addEventListener("click", () => {
                        gameSelected(data);
                    });
                    firstCell.dataset.selectBound = "1";
                }
            },
        });
    });

    onDestroy(() => {
        if (tableApi) {
            tableApi.destroy();
            tableApi = null;
        }
    });

    $effect(() => {
        // Access to establish dependency
        GamesStore.games;
        if (tableApi) {
            tableApi.clear();
            if (GamesStore.games?.length) {
                tableApi.rows.add(GamesStore.games);
            }
            tableApi.draw(false);
        }
    });
</script>

<div class="relative">
    {#if GamesStore.isLoading}
        <div class="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm">
            <Skeleton />
        </div>
    {/if}
    <table class="min-w-full divide-y divide-border" bind:this={tableEl}>
        <thead class="bg-card">
            <tr>
                <th class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Titre</th>
                <th class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider"></th>
            </tr>
        </thead>
        <tbody class="divide-y divide-border bg-popover"></tbody>
    </table>
</div>

<svelte:head>
    <link rel="stylesheet" href="/css/datatables.min.css" />
    <link rel="stylesheet" href="/css/datatables.theme.css" />
</svelte:head>

<style>
    /* Keep row height consistent */
    table.dataTable tbody tr {
        height: 4rem;
    }

    /* Hover */
    table.dataTable tbody tr.selected,
    table.dataTable tbody tr:hover {
        background: hsl(var(--muted) / 0.25);
    }

    /* Sticky header (works after DT builds) */
    table.dataTable thead th {
        position: sticky;
        top: 0;
        z-index: 10;
        background: hsl(var(--card));
    }
</style>
