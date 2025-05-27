<script lang="ts">
    import * as Avatar from "$lib/components/ui/avatar/index.js";
    import type { LiveUser } from "$src/lib/shared-models";
    import { ArrowDown, Gamepad2 } from "@lucide/svelte";
    import { fly } from "svelte/transition";
    import UserStatusDot from "./UserStatusDot.svelte";
    import Button from "../ui/button/button.svelte";
    import { goto } from "$app/navigation";
    import { GamesStore } from "$src/lib/stores/games.svelte";
    let { user }: { user: LiveUser } = $props();
</script>

<div class="relative flex h-10 w-full items-center justify-start gap-2">
    <div class="relative">
        <Avatar.Root class="size-8 ring-primary {user.isSpeaking ? 'ring' : 'ring-0'}">
            <Avatar.Image src="/api/avatars/{user.id}" alt={user.name} class="object-cover object-center" />
            <Avatar.Fallback class="text-muted-foreground">
                {user.name?.charAt(0)}{user.name?.charAt(1)}
            </Avatar.Fallback>
        </Avatar.Root>

        <!-- Status dot -->
        {#key user.status}
            <UserStatusDot status={user.status?.toString()!} />
        {/key}
    </div>
    <div class="flex min-h-8 flex-col justify-center text-start">
        <span class:text-primary={user.role === "admin"} class="text-lg leading-tight">{user.name}</span>
        {#if user.activity && user.activity.activityType !== "Idle"}
            <div
                transition:fly={{ y: -10, duration: 300 }}
                class="flex items-center gap-1 overflow-hidden text-xs font-bold text-gray-500">
                {#if user.activity.activityType === "Playing"}
                    <Gamepad2 class="inline-block h-4 w-4 text-green-600" />
                {:else}
                    <ArrowDown class="inline-block h-4 w-4 text-blue-600" />
                {/if}

                <div
                    role="button"
                    onclick={async () => await goto(`/games/${user.activity?.gameSlug}`)}
                    class="flex h-3 items-center gap-1 p-0 text-xs">
                    <span class="truncate p-1 text-primary/70">{user.activity.gameTitle}</span>
                </div>
            </div>

            <img
                src={`${GamesStore.getGameScreenshot(user.activity?.gameSlug)}`}
                alt={user.activity?.gameTitle}
                class="pointer-events-none absolute right-0 h-full w-auto rounded-xl [mask-image:linear-gradient(to_right,transparent_0%,transparent_0%,black_100%)]"
                transition:fly={{ y: -10, duration: 300 }} />
        {/if}
    </div>
</div>

<style>
    .game-cover {
        mask-image: linear-gradient(to left, rgba(0, 0, 0, 1) 10%, rgba(0, 0, 0, 0) 100%);
    }
</style>
