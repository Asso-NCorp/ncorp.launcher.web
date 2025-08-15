<script lang="ts">
    import GamesDataTable from "$src/lib/components/custom/GamesDataTable.svelte";
    import GamesGrid from "$src/lib/components/custom/GamesGrid.svelte";
    import { ArrowBigUpDash, Trash } from "@lucide/svelte";
    import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
    import ScrollArea from "$src/lib/components/ui/scroll-area/scroll-area.svelte";
    import { Button } from "$src/lib/components/ui/button";
    import { fly } from "svelte/transition";
    import { GamesStore } from "$src/lib/states/games.svelte";
    import { global } from "$src/lib/states/global.svelte";
    import { cleanHeadMenu, setHeadMenu } from "../layout-slots.svelte";
    import BlurFade from "$src/lib/components/custom/BlurFade.svelte";
    import { Badge } from "$src/lib/components/ui/badge";

    setHeadMenu(head, title);
    let filteredGames = $derived(GamesStore.games.filter((game) => game.isSelected && game.isInstalled));

    $effect(() => {
        return cleanHeadMenu;
    });
</script>

{#snippet title()}
    <BlurFade delay={0.3} class="text-3xl font-bold">Liste des jeux installés</BlurFade>
{/snippet}
{#snippet head()}
    {#if GamesStore.selected.length > 0}
        <div transition:fly={{ y: -10, duration: 200 }} class="flex gap-2">
            <Button onclick={() => GamesStore.uninstallGames(filteredGames)} variant="outline">
                <ArrowBigUpDash /> Désinstaller la sélection
                {#key GamesStore.selected}
                    <div in:fly={{ y: -10, duration: 200 }}>
                        <Badge variant="secondary" class="ml-2">
                            {filteredGames.length}
                        </Badge>
                    </div>
                {/key}
            </Button>
        </div>
    {/if}
    {#if GamesStore.games.some((g) => g.isInstalled)}
        <AlertDialog.Root>
            <AlertDialog.Trigger>
                <Button variant="outline" class="border-danger/50">
                    <Trash class="text-danger/50" /> Supprimer tous les jeux installés
                </Button>
            </AlertDialog.Trigger>
            <AlertDialog.Content>
                <AlertDialog.Header>
                    <AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
                    <AlertDialog.Description>
                        This action cannot be undone. This will permanently delete your account and remove your data
                        from our servers.
                    </AlertDialog.Description>
                </AlertDialog.Header>
                <AlertDialog.Footer>
                    <AlertDialog.Cancel>Annuler</AlertDialog.Cancel>
                    <AlertDialog.Action
                        class="border-primary bg-background text-danger"
                        onclick={() => GamesStore.uninstallAllInstalledGames()}>
                        Tout supprimer
                    </AlertDialog.Action>
                </AlertDialog.Footer>
            </AlertDialog.Content>
        </AlertDialog.Root>
    {/if}
{/snippet}

{#if global.gamesDisplayMode === "grid"}
    <ScrollArea class="flex-1">
        <GamesGrid games={GamesStore.games.filter((game) => game.isInstalled || game.isInstalling)} />
    </ScrollArea>
{:else}
    <ScrollArea class="flex-1">
        <GamesDataTable
            games={GamesStore.games.filter((game) => game.isInstalled || game.isInstalling)}
            loading={GamesStore.isLoading} />
    </ScrollArea>
{/if}
