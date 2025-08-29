<script lang="ts">
    import { Skeleton } from "$lib/components/ui/skeleton";
    import { authClient, type User } from "$src/lib/auth/client";
    import DataTable, { type Api } from "datatables.net-dt";
    import { onMount, onDestroy } from "svelte";

    let {
        loading,
        users = $bindable(),
        onSelect,
    }: { loading: boolean; users: User[]; onSelect: (user: User) => void } = $props();

    let table: HTMLTableElement | null = null;
    let tableApi: Api<any> | null = null;

    const COL_WIDTH = "16.66%"; // equal width for 6 columns

    const handleDelete = async (user: User) => {
        await authClient.admin.removeUser({
            userId: user.id,
        });

        window.location.reload();
    };

    const localDateTime = (date: string) => {
        // Add 2h
        const d = new Date(date);
        d.setHours(d.getHours() + 2);
        return d.toLocaleString();
    };

    onMount(() => {
        if (!table) return;
        tableApi = new DataTable(table, {
            data: users,
            searching: true,
            paging: false,
            pageLength: 15,
            lengthMenu: [10, 15, 25, 50],
            order: [[3, "desc"]],
            columnDefs:[
                {
                    targets: 0,
                    orderable: false,
                },
                {
                    targets: 1,
                    className: "font-medium",
                },
                {
                    targets: 2,
                    className: "text-center",
                },
                {
                    targets: 3,
                    className: "text-center",
                },
                {
                    targets: 4,
                    className: "text-center",
                },
                {
                    targets: 5,
                    orderable: false,
                },
            ],
            columns: [
                {
                    title: "",
                    data: null,
                    orderable: false,
                    width: COL_WIDTH,
                    className: "", // removed w-14 to allow equal width
                    render: (data, type, row: User) => {
                        if (type === "display") {
                            const alt = row.name ?? "";
                            return `<img src="/api/avatars/${row.id}" alt="${alt}" class="size-8 rounded-full ring-2 ring-primary object-cover" />`;
                        }
                        return row.id;
                    },
                },
                { title: "Utilisateur", data: "name", className: "font-medium", width: COL_WIDTH },
                { title: "Rôle", data: "role", className: "text-center", width: COL_WIDTH },
                {
                    title: "Date d'inscription",
                    data: "createdAt",
                    className: "text-center",
                    width: COL_WIDTH,
                    render: (data, type) => (type === "display" ? new Date(data).toLocaleDateString() : data),
                },
                {
                    title: "Dernière connexion",
                    data: "lastLogin",
                    className: "text-center",
                    width: COL_WIDTH,
                    render: (data, type) => (type === "display" && data ? localDateTime(data) : data ? data : "Jamais"),
                },
                { title: "", data: null, orderable: false, defaultContent: "", width: COL_WIDTH },
            ],
            createdRow: (row, data: User) => {
                // row click selects the user
                row.addEventListener("click", () => onSelect(data));

                // actions cell (last)
                const td = row.cells[5];
                const btn = document.createElement("button");
                btn.textContent = "Supprimer";
                btn.className = "px-3 py-1 border text-destructive-foreground hover:bg-destructive/10";
                btn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    if (confirm("Êtes-vous sûr ? Cette action est irréversible.")) {
                        handleDelete(data);
                    }
                });
                td.classList.add("text-right");
                td.appendChild(btn);
            },
        });
    });

    onDestroy(() => {
        if (tableApi) tableApi.destroy();
    });

    // Refresh the table when users changes
    $effect(() => {
        if (tableApi) {
            tableApi.clear();
            tableApi.rows.add(users);
            tableApi.draw();
        }
    });
</script>

<svelte:head>
    <link rel="stylesheet" href="/css/datatables.min.css" />
    <link rel="stylesheet" href="/css/datatables.theme.css" />
</svelte:head>

{#if loading}
    <Skeleton />
{:else}
    <span>Sélectionnez un utilisateur</span>
    <table class="user-table min-w-full divide-y divide-border" bind:this={table}>
        <thead class="bg-card">
            <tr>
                <th class="w-10"></th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Utilisateur</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Rôle</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date d'inscription</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Dernière connexion</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"></th>
            </tr>
        </thead>
        <tbody class="divide-y divide-border bg-popover"></tbody>
    </table>
{/if}

<style>
    table.user-table {
        table-layout: fixed;
        width: 100%;
    }
    table.user-table th,
    table.user-table td {
        width: calc(100% / 6);
    }
</style>
