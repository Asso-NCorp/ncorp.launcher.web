<script lang="ts">
    import type { LiveUser } from "$src/lib/shared-models";
    import { ArrowDown, Gamepad2 } from "@lucide/svelte";
    import { fade, fly } from "svelte/transition";
    import UserStatusDot from "./UserStatusDot.svelte";
    import { goto } from "$app/navigation";
    import Progress from "../ui/progress/progress.svelte";
    import AvatarDiscord from "./AvatarDiscord.svelte";
    import { tick } from "svelte";
    import AdminStatusDot from "./AdminStatusDot.svelte";
    import { GamesStore } from "$src/lib/states/games.svelte";
    import { page } from "$app/state";
    import type { role } from "@prisma/client";

    let { user }: { user: LiveUser } = $props();

    var roles = (page.data["roles"] as role[]) || [];

    let videoEl: HTMLVideoElement | null = null;
    let hovering = $state(false);
    let playToken = 0;
    let isPlaying = $state(false);

    const userRole = roles.find((r) => r.name === user.role);

    // Avatar decoration: prefer static when idle, animated on hover; fallback if only one provided
    let avatarDecorationSrc = $derived(() => {
        if (!userRole) return undefined;
        const staticDeco = userRole.avatar_decoration_static;
        const animatedDeco = userRole.avatar_decoration_animated;
        if (hovering) return animatedDeco || staticDeco;
        return staticDeco || animatedDeco;
    });

    // Nameplate assets presence
    const hasNameplateStatic = $derived(!!userRole?.nameplate_decoration_static);
    const hasNameplateAnimated = $derived(!!userRole?.nameplate_decoration_animated);
    const shouldShowNameplate = $derived(() => !!userRole && (hasNameplateStatic || hasNameplateAnimated));

    // Accessors (functions because $derived returns functions in this setup)
    const nameplateStatic = $derived(() =>
        userRole ? userRole.nameplate_decoration_static || userRole.nameplate_decoration_animated : undefined,
    );
    const nameplateAnimated = $derived(() => (userRole ? userRole.nameplate_decoration_animated : undefined));

    let shouldShowActivityImage = $derived(
        user.activity?.activityType === "Playing" ||
            (user.activity?.activityType === "Installing" && user.activity?.gameSlug),
    );

    let showActivity = $derived(
        !!user.activity && user.activity.activityType !== "Idle" && user.status !== "Disconnected",
    );

    function waitCanPlay(el: HTMLVideoElement) {
        return new Promise<void>((resolve) => {
            if (el.readyState >= 2) return resolve();
            const on = () => {
                el.removeEventListener("loadeddata", on);
                resolve();
            };
            el.addEventListener("loadeddata", on, { once: true });
        });
    }

    async function handleMouseEnter() {
        if (!shouldShowNameplate() || !hasNameplateAnimated) {
            hovering = true; // still allow avatar decoration hover effect
            return;
        }
        hovering = true;
        const myToken = ++playToken;
        await tick();
        if (!videoEl) return;

        // Ensure correct src only if not already set
        const targetUrl = nameplateAnimated();
        if (!targetUrl) return;
        if (videoEl.currentSrc !== targetUrl && videoEl.src !== targetUrl) {
            videoEl.src = targetUrl;
            videoEl.load();
        }

        await waitCanPlay(videoEl);
        if (myToken !== playToken) return;
        try {
            const p = videoEl.play();
            if (p && typeof p.then === "function") await p;
            if (myToken !== playToken) {
                videoEl.pause();
                videoEl.currentTime = 0;
                isPlaying = false;
                return;
            }
            isPlaying = true;
        } catch (e) {
            console.error("play() blocked:", e);
            isPlaying = false;
        }
    }

    function handleMouseLeave() {
        hovering = false;
        playToken++;
        if (videoEl) {
            videoEl.pause();
            videoEl.currentTime = 0;
        }
        isPlaying = false;
    }
</script>

<div
    onmouseenter={handleMouseEnter}
    onmouseleave={handleMouseLeave}
    class:opacity-50={user.status === "Disconnected"}
    class="group ml-2 h-10 w-full max-w-[calc(var(--userlist-width)_-_1rem)] cursor-pointer py-[1px]">
    <div
        class="relative flex h-full items-center justify-start gap-2 overflow-hidden rounded-[0.5rem] px-2 group-hover:bg-secondary/50">
        <div class="relative">
            <AvatarDiscord
                size={32}
                name={user.name!}
                src={`/api/avatars/${user.id}`}
                alt={user.name}
                decorationSrc={avatarDecorationSrc()}
                ring={user.isSpeaking} />
            {#if page.data?.user?.role === "admin"}
                <AdminStatusDot {user} />
            {:else}
                <UserStatusDot status={user.status} />
            {/if}
        </div>

        
        <!-- GRID pour garder le nom centré quand l’activité est absente -->
        <div class="name-activity-grid h-8 min-h-8 w-full overflow-hidden text-start">
            {#if shouldShowActivityImage}
                <img
                    in:fade={{ duration: 300 }}
                    out:fade={{ duration: 200 }}
                    src={GamesStore.getGameScreenshot(user.activity!.gameSlug!)}
                    alt={user.activity?.gameTitle || user.name}
                    style="mask-image:linear-gradient(90deg, transparent 0%, rgba(0, 128, 183, .08) 20%, rgba(0, 128, 183, .08) 50%, rgba(0, 128, 183, .6) {hovering
                        ? '70'
                        : '100'}%);"
                    class="pointer-events-none absolute right-0 w-full object-contain object-center opacity-70 transition-all duration-300 group-hover:opacity-100" />
            {/if}

            <!-- Nom -->
            <span
                class:text-primary={user.role === "admin"}
                class="max-w-[90%] self-center truncate font-ggsans-medium text-base font-thin leading-tight">
                {user.name}
            </span>

            <!-- Activité (dépliage doux) -->
            <div class="activity-reveal w-full" class:show={showActivity}>
                {#if showActivity}
                    <div
                        transition:fly={{ y: -10, duration: 250 }}
                        class="z-20 flex w-full items-center gap-1 overflow-hidden text-xs font-bold text-gray-500">
                        {#if user.activity?.activityType === "Playing"}
                            <Gamepad2 class="inline-block h-4 w-4 text-green-600" />
                        {:else}
                            <ArrowDown class="inline-block h-4 w-4 text-blue-600" />
                        {/if}
                        <div
                            role="button"
                            onclick={async () => await goto(`/games/${user.activity?.gameSlug}`)}
                            class="flex h-3 flex-1 items-center justify-items-start gap-1 p-0 text-xs">
                            <span class="w-full max-w-[75%] truncate p-1 text-primary/70">
                                {user.activity?.gameTitle}
                            </span>
                            {#if user.gameInstallProgress && user.gameInstallProgress > 0 && user.gameInstallProgress < 100}
                                <span class="text-xs text-white/70">({user.gameInstallProgress}%)</span>
                            {/if}
                        </div>
                    </div>
                {/if}
            </div>

            {#if user.gameInstallProgress && user.gameInstallProgress > 0 && user.gameInstallProgress < 100}
                <Progress
                    value={user.gameInstallProgress}
                    class="pointer-events-none absolute -bottom-px right-2 h-[3px] w-[80%] self-center"
                    color="primary"
                    aria-label="Game install progress" />
            {/if}
        </div>

        {#if shouldShowNameplate()}
            {#if !hasNameplateAnimated || hovering === false || user.status === "Disconnected"}
                <img
                    in:fade={{ duration: 300 }}
                    out:fade={{ duration: 200 }}
                    src={nameplateStatic()}
                    alt={user.activity?.gameTitle || user.name}
                    class="pointer-events-none absolute right-0 h-full object-cover object-center"
                    style="background: linear-gradient(90deg, transparent 0%, rgba(0,128,183,.08) 20%, rgba(0,128,183,.08) 50%, rgba(0,128,183,.2) 100%);" />
            {/if}
            {#if hasNameplateAnimated && user.status !== "Disconnected"}
                <video
                    bind:this={videoEl}
                    poster={nameplateStatic()}
                    muted
                    playsinline
                    loop
                    src={nameplateAnimated()}
                    preload="metadata"
                    class:opacity-80={hovering}
                    class:opacity-0={hovering === false}
                    class="pointer-events-none absolute right-0 h-full object-cover transition-opacity duration-300 ease-linear"
                    style="background: linear-gradient(90deg, transparent 0%, rgba(0,128,183,.08) 20%, rgba(0,128,183,.08) 50%, rgba(0,128,183,.2) 100%);">
                </video>
            {/if}
        {/if}

        {#if user.downloadSpeedMegaBytesPerSecond && user.downloadSpeedMegaBytesPerSecond > 0}
            <div class="absolute top-0 right-2 text-xss flex gap-1 items-center text-white/60 font-ggsans-bold" style="text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);">
                <span class="text-[0.65rem] text-blue-600">↓</span>
                <span>{user.downloadSpeedMegaBytesPerSecond.toFixed(1)} Mo/s</span>
            </div>
        {/if}

    </div>
</div>

<style>
    .name-activity-grid {
        display: grid;
        grid-template-rows: 1fr auto;
        align-items: center;
    }

    .activity-reveal {
        max-height: 0;
        opacity: 0;
        overflow: hidden;
        transition:
            max-height 220ms cubic-bezier(0.22, 0.61, 0.36, 1),
            opacity 200ms linear 40ms;
    }
    .activity-reveal.show {
        max-height: 22px;
        opacity: 1;
    }
</style>
