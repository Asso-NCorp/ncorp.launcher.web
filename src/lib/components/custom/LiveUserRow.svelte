<script lang="ts">

    import type { LiveUser } from "$src/lib/shared-models";
    import { ArrowDown, Gamepad2 } from "@lucide/svelte";
    import { fly } from "svelte/transition";
    import UserStatusDot from "./UserStatusDot.svelte";
    import { goto } from "$app/navigation";
    import { GamesStore } from "$src/lib/states/games.svelte";
    import Progress from "../ui/progress/progress.svelte";
    import AvatarDiscord from "./AvatarDiscord.svelte";
    import { PUBLIC_BACKEND_API_URL } from "$env/static/public";
    let { user }: { user: LiveUser } = $props();
    let animate = $state(false);
    const handleMouseEnter = () => {
        animate = true;
    };

    const handleMouseLeave = () => {
        animate = false;
    };
</script>

<!-- Dans ta ligne utilisateur -->
<div
    onmouseenter={handleMouseEnter}
    onmouseleave={handleMouseLeave}
    class="group ml-2 h-10 w-full max-w-[calc(var(--userlist-width)_-_1rem)] cursor-pointer py-[1px]">
    <div class="rounded-[0.5rem] px-2 relative flex h-full items-center justify-start gap-2 group-hover:bg-secondary/50">
        <div class="relative">
            <AvatarDiscord
                size={32}
                name={user.name!}
                src={`/api/avatars/${user.id}`}
                alt={user.name}
                decorationSrc={user.role === "admin"
                    ? `/api/medias/decorations?filename=admin&animated=${animate}`
                    : undefined}
                ring={user.isSpeaking} />

            <!-- Ton composant/élément de statut externe -->
            <UserStatusDot status={user.status} class="absolute -bottom-0 -right-0" />
        </div>

        <div class="flex min-h-8 flex-col justify-center overflow-hidden text-start">
            <span class:text-primary={user.role === "admin"} class="text-base font-thin leading-tight font-ggsans-medium">
                {user.name}
            </span>

            {#if user.activity && user.activity.activityType !== "Idle" && user.status !== "Disconnected"}
                <img
                    src={GamesStore.getGameScreenshot(user.activity?.gameSlug)}
                    alt={user.activity?.gameTitle}
                    class="pointer-events-none absolute right-0 h-full w-2/3 rounded-xl object-cover [mask-image:linear-gradient(to_right,transparent_0%,transparent_0%,black_100%)]"
                    transition:fly={{ y: -10, duration: 300 }} />

                <div
                    transition:fly={{ y: -10, duration: 300 }}
                    class="flex items-center gap-1 overflow-hidden text-xs font-bold text-gray-500">
                    {#if user.activity.activityType === "Playing"}
                        <Gamepad2 class="inline-block h-4 w-4 text-green-600" />
                    {:else}
                        <ArrowDown class="animate-bounce-fade inline-block h-4 w-4 text-blue-600" />
                    {/if}

                    <div
                        role="button"
                        onclick={async () => await goto(`/games/${user.activity?.gameSlug}`)}
                        class="z-20 flex h-3 items-center gap-1 p-0 text-xs">
                        <span class="truncate p-1 text-primary/70">{user.activity.gameTitle}</span>
                    </div>

                    {#if user.gameInstallProgress && user.gameInstallProgress > 0 && user.gameInstallProgress < 100}
                        <Progress
                            value={user.gameInstallProgress}
                            class="absolute -bottom-2 right-0 h-0.5 w-full"
                            color="primary"
                            aria-label="Game install progress" />
                    {/if}
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    .game-cover {
        mask-image: linear-gradient(to left, rgba(0, 0, 0, 1) 10%, rgba(0, 0, 0, 0) 100%);
    }

    :global(.animate-bounce-fade) {
        animation: bounceDownFade 2s ease-in-out infinite;
    }

    @keyframes bounceDownFade {
        0%,
        100% {
            transform: translateY(0);
            opacity: 1;
        }
        50% {
            transform: translateY(3px);
            opacity: 0.4;
        }
    }
</style>
