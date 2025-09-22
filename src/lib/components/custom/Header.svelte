<script lang="ts">
    import type { Snippet } from "svelte";
    import { GamesStore } from "$src/lib/states/games.svelte";
    import { Progress } from "../ui/progress";
    import { fly } from "svelte/transition";
    import { cn } from "$src/lib/utils";
    import GridPattern from "./GridPattern.svelte";
    import Card from "../ui/card/card.svelte";
    import Button from "../ui/button/button.svelte";

    let {
        children,
        class: klazz,
    }: {
        children?: Snippet;
        class?: string;
    } = $props();
</script>

<header>
    <div class={cn("flex h-auto items-center gap-2", klazz)}>
        <div class="mx-auto flex h-11 w-full gap-1 overflow-x-auto overflow-y-hidden">
            {#each GamesStore.games?.filter((g) => g.isInstalling) as game}
                <div transition:fly={{ y: -20, duration: 200 }} class="h-full flex-1">
                    <div class="flex h-full items-center gap-2 px-1">
                        <div class="flex flex-col">
                            <a
                                href="/games/{game.folderSlug}"
                                class="w-auto text-nowrap px-2 text-sm font-bold hover:underline">
                                {game.title}
                            </a>
                            <div class="flex items-center gap-2 px-1">
                                <Progress class="h-1 w-full" value={game.installProgress} />
                                <span class="text-xss">{game.installProgress}%</span>
                            </div>
                        </div>
                        <Card class="flex items-center justify-center bg-secondary text-primary shadow-sm">
                            <Button
                                size="sm"
                                variant="ghost"
                                class="text-scroll-m-0"
                                disabled={game.isCancellingInstall || game.installProgress >= 50}
                                onclick={() => {
                                    GamesStore.cancelGameInstallation(game);
                                }}>
                                x
                            </Button>
                        </Card>
                    </div>
                </div>
            {/each}
        </div>

        {@render children?.()}

        <GridPattern
            width={20}
            height={20}
            strokeDashArray="4 2"
            fillColor="rgb(156 163 175 / 0.1)"
            class={cn("mask-[radial-gradient(1200px_circle_at_center,white,transparent)]")} />
    </div>
</header>
