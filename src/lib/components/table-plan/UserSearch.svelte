<script lang="ts">
    import { Search } from "@lucide/svelte";
    import { t } from "$lib/translations";
    import { Input } from "$lib/components/ui/input";
    import { onMount } from "svelte";

    interface User {
        id: string;
        name: string;
        role: string;
        image?: string;
    }

    // Props
    let {
        selectedName = $bindable(""),
        users = [],
        addedUserIds = [],
        onUserSelect,
    } = $props<{
        selectedName?: string;
        users: User[];
        addedUserIds: string[];
        onUserSelect: (user: User) => void;
    }>();

    // State
    let searchResults = $state<User[]>([]);
    let searchOpen = $state(false);
    let searchQuery = $state("");
    let searchContainer = $state<HTMLDivElement | undefined>(undefined);
    let searchTimeout = $state<ReturnType<typeof setTimeout> | null>(null);

    // Handle clicks outside the dropdown to close it
    onMount(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchOpen && searchContainer && !searchContainer.contains(event.target as Node)) {
                searchOpen = false;
            }
        };

        document.addEventListener("click", handleClickOutside);

        return () => {
            document.removeEventListener("click", handleClickOutside);
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
        };
    });

    function searchUsers(query: string) {
        if (!query || query.length < 0) {
            // Show all available users (not yet added)
            searchResults = users.filter((u: User) => !addedUserIds.includes(u.id));
            return;
        }

        // Filter users by name (case-insensitive) and exclude already added users
        searchResults = users.filter(
            (u: User) => !addedUserIds.includes(u.id) && u.name.toLowerCase().includes(query.toLowerCase()),
        );
    }

    function handleSearchInput(event: Event) {
        const target = event.target as HTMLInputElement;
        searchQuery = target.value;

        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        searchTimeout = setTimeout(() => {
            searchUsers(searchQuery);
            if (searchResults.length > 0 && !searchOpen) {
                searchOpen = true;
            }
        }, 150); // Shorter debounce for local filtering
    }

    function handleUserSelection(user: User) {
        selectedName = user.name;
        onUserSelect(user);
        searchOpen = false;
        searchQuery = "";
        searchResults = [];
    }

    function handleInputFocus() {
        searchResults = users.filter((u: User) => !addedUserIds.includes(u.id));
        if (searchResults.length > 0) {
            searchOpen = true;
        }
    }

    function handleInputChange(event: Event) {
        const target = event.target as HTMLInputElement;
        selectedName = target.value;
        handleSearchInput(event);
    }
</script>

<div class="relative" bind:this={searchContainer}>
    <div class="relative">
        <Input
            placeholder="{t.get('search_user')}..."
            autocomplete="off"
            bind:value={selectedName}
            type="text"
            oninput={handleInputChange}
            onfocus={handleInputFocus}
            class="pr-10" />
        <div class="absolute inset-y-0 right-0 flex items-center pr-3">
            <Search class="size-4 opacity-50" />
        </div>
    </div>

    {#if searchOpen}
        <div class="bg-popover absolute z-50 mt-1 w-full rounded-md border p-0 shadow-md">
            <div class="max-h-[300px] overflow-auto p-1">
                {#if searchResults.length === 0}
                    <div class="text-muted-foreground p-4 text-sm">
                        {t.get("no_element_found")}
                    </div>
                {:else}
                    <div class="grid gap-1">
                        {#each searchResults as user}
                            <button
                                class="hover:bg-accent flex w-full items-center gap-3 rounded-sm p-2 text-left"
                                onclick={() => handleUserSelection(user)}>
                                {#if user.image}
                                    <img
                                        src={user.image}
                                        alt={user.name}
                                        class="size-8 shrink-0 rounded-full object-cover" />
                                {:else}
                                    <div class="bg-muted size-8 shrink-0 rounded-full" />
                                {/if}
                                <div class="flex flex-1 flex-col">
                                    <div class="font-medium">{user.name}</div>
                                    <div class="text-muted-foreground text-xs">
                                        {user.role}
                                    </div>
                                </div>
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>
