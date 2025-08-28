<script lang="ts">
    import type { LiveUser } from "$src/lib/shared-models";
    import { ArrowDown, Gamepad2 } from "@lucide/svelte";
    import { fade, fly } from "svelte/transition";
    import UserStatusDot from "./UserStatusDot.svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import Progress from "../ui/progress/progress.svelte";
    import AvatarDiscord from "./AvatarDiscord.svelte";
    import { tick } from "svelte";
    import AdminStatusDot from "./AdminStatusDot.svelte";

    let { user }: { user: LiveUser } = $props();

    let videoEl: HTMLVideoElement | null = null;
    let hovering = $state(false);
    let playToken = 0;
    let isPlaying = $state(false);

    const base = `/api/medias/nametemplates?filename=${user.role}`;
    const videoUrl = `${base}&animated=true`;
    const posterUrl = `${base}&animated=false`;

    const shouldShowMedia =
        user.status !== "Disconnected" &&
        (user.role === "admin" || (user.activity && user.activity.activityType !== "Idle"));

    // Svelte 5
    let showActivity = $derived(
        !!user.activity && user.activity.activityType !== "Idle" && user.status !== "Disconnected"
    );

    function waitCanPlay(el: HTMLVideoElement) {
        return new Promise<void>((resolve) => {
            if (el.readyState >= 2) return resolve();
            const on = () => { el.removeEventListener("loadeddata", on); resolve(); };
            el.addEventListener("loadeddata", on, { once: true });
        });
    }

    async function handleMouseEnter() {
        if (!shouldShowMedia) return;
        hovering = true;
        const myToken = ++playToken;
        await tick();

        if (!videoEl) return;
        if (videoEl.currentSrc !== videoUrl && videoEl.src !== videoUrl) {
            videoEl.src = videoUrl; videoEl.load();
        }

        await waitCanPlay(videoEl);
        if (myToken !== playToken) return;

        try {
            const p = videoEl.play();
            if (p && typeof p.then === "function") await p;
            if (myToken !== playToken) { videoEl.pause(); videoEl.currentTime = 0; isPlaying = false; return; }
            isPlaying = true;
        } catch (e) { console.error("play() blocked:", e); isPlaying = false; }
    }

    function handleMouseLeave() {
        hovering = false; playToken++;
        if (videoEl) { videoEl.pause(); videoEl.currentTime = 0; }
        isPlaying = false;
    }
</script>

<div
    onmouseenter={handleMouseEnter}
    onmouseleave={handleMouseLeave}
    class:opacity-50={user.status === "Disconnected"}
    class="group ml-2 h-10 w-full max-w-[calc(var(--userlist-width)_-_1rem)] cursor-pointer py-[1px]">
    <div class="relative flex h-full items-center justify-start gap-2 rounded-[0.5rem] px-2 group-hover:bg-secondary/50">
        <div class="relative">
            <AvatarDiscord
                size={32}
                name={user.name!}
                src={`/api/avatars/${user.id}`}
                alt={user.name}
                decorationSrc={user.role === "admin"
                    ? `/api/medias/decorations?filename=admin&animated=${hovering}`
                    : undefined}
                ring={user.isSpeaking} />
            {#if $page.data?.user?.role === "admin"}
                <AdminStatusDot status={user.status} />
            {:else}
                <UserStatusDot status={user.status} />
            {/if}
        </div>

        <!-- GRID pour garder le nom centré quand l’activité est absente -->
        <div class="name-activity-grid min-h-8 overflow-hidden text-start">
            <!-- Nom -->
            <span
                class:text-primary={user.role === "admin"}
                class="font-ggsans-medium text-base font-thin leading-tight truncate self-center"
            >
                {user.name}
            </span>

            <!-- Activité (dépliage doux) -->
            <div class="activity-reveal" class:show={showActivity}>
                {#if showActivity}
                    <div
                        transition:fly={{ y: -10, duration: 250 }}
                        class="z-20 flex items-center gap-1 overflow-hidden text-xs font-bold text-gray-500">
                        {#if user.activity?.activityType === "Playing"}
                            <Gamepad2 class="inline-block h-4 w-4 text-green-600" />
                        {:else}
                            <ArrowDown class="inline-block h-4 w-4 text-blue-600" />
                        {/if}
                        <div
                            role="button"
                            onclick={async () => await goto(`/games/${user.activity?.gameSlug}`)}
                            class="flex h-3 items-center gap-1 p-0 text-xs">
                            <span class="truncate p-1 text-primary/70">{user.activity?.gameTitle}</span>
                        </div>
                        {#if user.gameInstallProgress && user.gameInstallProgress > 0 && user.gameInstallProgress < 100}
                            <Progress
                                value={user.gameInstallProgress}
                                class="absolute -bottom-[2px] right-0 h-0.5 w-[80%]"
                                color="primary"
                                aria-label="Game install progress" />
                        {/if}
                    </div>
                {/if}
            </div>
        </div>

        {#if shouldShowMedia}
            {#if hovering === false}
                <img
                    in:fade={{ duration: 300 }}
                    out:fade={{ duration: 200 }}
                    src={posterUrl}
                    alt={user.activity?.gameTitle || user.name}
                    class="pointer-events-none absolute right-0 h-full rounded-xl object-cover"
                    style="background: linear-gradient(90deg, transparent 0%, rgba(0, 128, 183, 0.08) 20%, rgba(0, 128, 183, 0.08) 50%, rgba(0, 128, 183, 0.2) 100%);" />
            {/if}
            <video
                bind:this={videoEl}
                src={videoUrl}
                muted
                playsinline
                loop
                preload="metadata"
                poster={posterUrl}
                class:opacity-80={hovering}
                class:opacity-0={hovering === false}
                class="pointer-events-none absolute right-0 h-full rounded-xl object-cover transition-opacity duration-300 ease-linear"
                style="background: linear-gradient(90deg, transparent 0%, rgba(0,128,183,.08) 20%, rgba(0,128,183,.08) 50%, rgba(0,128,183,.2) 100%);">
            </video>
        {/if}
    </div>
</div>

<style>
    .game-cover {
        mask-image: linear-gradient(to left, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 100%);
    }

    /* 2 lignes: 1fr (nom centré) + auto (activité). Quand pas d’activité, la 2e ligne est à 0 via max-height. */
    .name-activity-grid {
        display: grid;
        grid-template-rows: 1fr auto;
        align-items: center; /* centre verticalement le nom dans la 1ère ligne */
    }

    .activity-reveal {
        max-height: 0;
        opacity: 0;
        overflow: hidden;
        transition:
            max-height 220ms cubic-bezier(.22,.61,.36,1),
            opacity 200ms linear 40ms;
    }
    .activity-reveal.show {
        max-height: 22px; /* ≈ hauteur d’une ligne text-xs */
        opacity: 1;
    }
</style>
