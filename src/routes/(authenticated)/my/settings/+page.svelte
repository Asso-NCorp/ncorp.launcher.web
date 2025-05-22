<script lang="ts">
    import { Input } from "$src/lib/components/ui/input";
    import { Button } from "$src/lib/components/ui/button";
    import { Switch } from "$lib/components/ui/switch/index.js";
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import * as Settings from "$src/lib/components/ui/settings";
    import { t } from "$src/lib/translations";
    import Separator from "$src/lib/components/ui/separator/separator.svelte";
    import DirectoryChooser from "$src/lib/components/custom/dialog/directorychooser/DirectoryChooser.svelte";
    import { getLocalApi, getServerApi } from "$src/lib/utils";
    import { toast } from "svelte-sonner";
    import { global } from "$src/lib/states/global.svelte";
    import { GamesStore } from "$src/lib/stores/games.svelte";
    import { onMount } from "svelte";
    import { liveAgentConnection } from "$src/lib/states/live-agent.svelte";

    const localApi = getLocalApi();
    let notifications = $state(true);
    let darkMode = $state(true);
    let autoUpdate = $state(true);
    let soundEnabled = $state(true);
    let showDirectoryChoosed = $state(false);

    const getLocalGamesDir = async () => {
        try {
            const result = await getServerApi().getLocalGamesDir();
            if (result) {
                global.localGamesFolder = result.data!;
            } else {
                global.localGamesFolder = "";
            }
        } catch (error) {
            console.error(error);
        }
    };

    function toggleSoundEnabled() {
        soundEnabled = !soundEnabled;
    }

    const handleSaveGamesDirectory = async () => {
        // Save the games directory
        if (
            await getServerApi().setLocalGamesDir({
                path: global.localGamesFolder,
            })
        ) {
            showDirectoryChoosed = false;
            toast.success("Répertoire des jeux sauvegardé avec succès", {
                class: "bg-green-500",
            });

            await localApi.setLocalGamesDir({
                dir: global.localGamesFolder,
            });

            await GamesStore.getAvailableGames();
        } else {
            toast.error("Impossible de sauvegarder le répertoire des jeux", {
                class: "bg-red-500",
            });
        }
    };

    onMount(() => {
        getLocalGamesDir();
    });
</script>

<Dialog.Root open={showDirectoryChoosed} onOpenChange={(open) => (showDirectoryChoosed = open)}>
    <Dialog.Content class="max-h-2/3 sm:max-w-[825px]">
        <div class="grid gap-4 py-4">
            <DirectoryChooser bind:path={global.localGamesFolder} />
        </div>
        <Dialog.Footer>
            <Button
                type="submit"
                onclick={handleSaveGamesDirectory}
                disabled={!global.localGamesFolder || global.localGamesFolder.toString().endsWith(":")}>
                Sauvegarder
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

<div class="flex h-full max-w-5xl flex-col items-center gap-6 p-4">
    <div class="flex w-full max-w-3xl flex-col gap-3">
        <h2 class="mb-6 text-2xl font-bold">{$t("settings")}</h2>
        <Settings.Section title="Général">
            <Settings.Item title="Répertoire des jeux 📂" description="Dossier dans lequel les jeux seront installés">
                <div class="flex gap-2">
                    <Input value={global.localGamesFolder} disabled class="w-64" />
                    <Button
                        onclick={() => {
                            showDirectoryChoosed = true;
                        }}
                        variant="outline">
                        Parcourir...
                    </Button>
                </div>
            </Settings.Item>
        </Settings.Section>

        <!-- <Separator></Separator>

        <Settings.Section title="Notifications">
            <Settings.Item title="Sons de notification">
                <Switch checked={soundEnabled} onclick={toggleSoundEnabled} />
            </Settings.Item>
        </Settings.Section> -->
    </div>
</div>
