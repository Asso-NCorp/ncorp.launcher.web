<script lang="ts">
    import { RefreshCcwDot, RefreshCw, Search, X } from "@lucide/svelte";
    import Input from "../ui/input/input.svelte";
    import { t } from "$src/lib/translations";
    import { GamesStore } from "$src/lib/stores/games.svelte";
    import { global } from "$src/lib/states/global.svelte";
    import Button from "../ui/button/button.svelte";
    import GamesTitleSortButton from "./buttons/GamesTitleSortButton.svelte";
    import * as Tooltip from "$lib/components/ui/tooltip";
    import { toast } from "svelte-sonner";
    import { page } from "$app/state";

    const user = page.data.user;
    const role = user?.role;
    const isAdmin = role === "admin" || role === "superadmin"; // Vérification du rôle de l'utilisateur

    // Store pour le terme de recherche

    const handleSearch = () => {
        GamesStore.search();
    };

    const handleRefreshGamesClick = async () => {
        const refreshed = await GamesStore.getAvailableGames();
        if (refreshed) {
            toast.success("Liste des jeux rafraîchie avec succès", { class: "bg-green-500" });
        }
    };
</script>

<div class="flex">
    <Input
        bind:value={global.gamesSearchQuery}
        oninput={handleSearch}
        icon={Search}
        class="left-0 top-0 w-96 rounded-[var(--radius)]"
        placeholder="{$t('search_game')}..." />
    <Button
        variant="outline"
        class="border-l-0"
        disabled={!global.gamesSearchQuery || global.gamesSearchQuery === ""}
        onclick={GamesStore.clearSearch}>
        <X />
    </Button>
    <GamesTitleSortButton />

    <Tooltip.Root>
        <Tooltip.Trigger>
            <Button onclick={handleRefreshGamesClick} variant="outline" class="border-l-0">
                <RefreshCw />
            </Button>
        </Tooltip.Trigger>
        <Tooltip.Content>
            <p>Rafraîchir la liste des jeux</p>
        </Tooltip.Content>
    </Tooltip.Root>
</div>
