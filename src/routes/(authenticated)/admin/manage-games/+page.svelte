<script lang="ts">
    import type { PageData } from "./$types";
    import AddgameForm from "./addgame-form.svelte";
    import { GamesStore } from "$src/lib/states/games.svelte";
    import * as Card from "$lib/components/ui/card";
    import { Gamepad2 } from "@lucide/svelte";
    import BlurFade from "$src/lib/components/custom/BlurFade.svelte";

    let { data }: { data: PageData } = $props();

    const games = $derived(GamesStore.availableGames);
    const gameCount = $derived(games?.length ?? 0);
</script>

<main class="flex h-full flex-col space-y-6 p-6">
    <!-- Header Section -->
    <div class="space-y-2">
        <div class="flex items-center gap-3">
            <div class="rounded-lg bg-linear-to-br from-primary/20 to-primary/10 p-2">
                <Gamepad2 class="size-6 text-primary" />
            </div>
            <BlurFade delay={0.2} class="text-3xl font-bold">Gestion des Jeux</BlurFade>
        </div>
        <p class="text-sm text-muted-foreground">Ajouter et gérer les jeux disponibles</p>
    </div>

    <!-- Main Content -->
    <div class="flex-1 min-h-0">
        <Card.Root class="h-full flex flex-col">
            <Card.Header class="border-b">
                <Card.Title>Ajouter un nouveau jeu</Card.Title>
            </Card.Header>
            <Card.Content class="flex-1 overflow-auto p-6">
                <AddgameForm {data} />
            </Card.Content>
        </Card.Root>
    </div>
</main>
