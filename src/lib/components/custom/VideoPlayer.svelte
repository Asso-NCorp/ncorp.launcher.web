<script lang="ts">
    import { Play, Pause, Volume2, VolumeX, Maximize2 } from "@lucide/svelte";
    import { fade } from "svelte/transition";
    import Button from "../ui/button/button.svelte";
    import { cn } from "$src/lib/utils";

    interface Props {
        src: string;
        poster?: string;
        class?: string;
        title?: string;
    }

    let { src, poster, class: klass, title }: Props = $props();

    let videoElement: HTMLVideoElement | null = $state(null);
    let isPlaying = $state(false);
    let isMuted = $state(false);
    let volume = $state(1);
    let currentTime = $state(0);
    let duration = $state(0);
    let isFullscreen = $state(false);
    let containerRef: HTMLDivElement | null = $state(null);
    let showControls = $state(true);
    let hideControlsTimeout: ReturnType<typeof setTimeout> | null = null;
    let showPlayPauseIcon = $state(false);
    let playPauseIconTimeout: ReturnType<typeof setTimeout> | null = null;

    function togglePlay() {
        if (!videoElement) return;
        if (isPlaying) {
            videoElement.pause();
        } else {
            videoElement.play();
        }

        // Show play/pause icon
        showPlayPauseIcon = true;
        if (playPauseIconTimeout) clearTimeout(playPauseIconTimeout);
        playPauseIconTimeout = setTimeout(() => {
            showPlayPauseIcon = false;
        }, 400); // Fade out after animation completes
    }

    function toggleMute() {
        if (!videoElement) return;
        isMuted = !isMuted;
        videoElement.muted = isMuted;
    }

    function handleVolumeChange(e: Event) {
        const target = e.target as HTMLInputElement;
        const vol = parseFloat(target.value);
        volume = vol;
        if (videoElement) {
            videoElement.volume = vol;
        }
    }

    function formatTime(seconds: number): string {
        if (!isFinite(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    }

    async function toggleFullscreen() {
        if (!containerRef) return;

        try {
            if (!document.fullscreenElement) {
                await containerRef.requestFullscreen();
                isFullscreen = true;
            } else {
                await document.exitFullscreen();
                isFullscreen = false;
            }
        } catch (error) {
            console.error("Fullscreen error:", error);
        }
    }

    function handleFullscreenChange() {
        isFullscreen = !!document.fullscreenElement;
    }

    function handleTimeUpdate() {
        if (videoElement) {
            currentTime = videoElement.currentTime;
        }
    }

    function handleLoadedMetadata() {
        if (videoElement) {
            duration = videoElement.duration;
        }
    }

    function handlePlayPause() {
        isPlaying = videoElement ? !videoElement.paused : false;
        resetHideControlsTimer();
    }

    function handleProgressClick(e: MouseEvent) {
        if (!videoElement || !duration) return;
        const progressBar = e.currentTarget as HTMLDivElement;
        const rect = progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, clickX / rect.width));
        videoElement.currentTime = percentage * duration;
    }

    function resetHideControlsTimer() {
        if (hideControlsTimeout) {
            clearTimeout(hideControlsTimeout);
        }
        showControls = true;
        if (isPlaying && !showPlayPauseIcon) {
            hideControlsTimeout = setTimeout(() => {
                showControls = false;
            }, 2000);
        }
    }

    function handleMouseMove() {
        resetHideControlsTimer();
    }

    function handleMouseLeave() {
        // Fade out immediately when mouse leaves
        if (hideControlsTimeout) {
            clearTimeout(hideControlsTimeout);
        }
        showControls = false;
    }

    function handleMouseEnter() {
        // Show controls when mouse enters
        showControls = true;
        resetHideControlsTimer();
    }
</script>

<svelte:document onfullscreenchange={handleFullscreenChange} />

<div
    bind:this={containerRef}
    class={cn("relative overflow-hidden rounded-lg bg-black", isFullscreen && "fixed inset-0 z-50 rounded-none", klass)}
    onmousemove={handleMouseMove}
    onmouseenter={handleMouseEnter}
    onmouseleave={handleMouseLeave}
    role="region"
    aria-label="Video player">
    <!-- Video Element (no controls) -->
    <video
        bind:this={videoElement}
        {src}
        {poster}
        class="h-full w-full cursor-pointer object-cover"
        onplay={handlePlayPause}
        onpause={handlePlayPause}
        ontimeupdate={handleTimeUpdate}
        onloadedmetadata={handleLoadedMetadata}
        onclick={togglePlay} />

    <!-- Play/Pause Icon Center (YouTube-style transition) -->
    {#if showPlayPauseIcon || !isPlaying}
        <div
            class="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
            transition:fade={{ duration: 200 }}>
            <!-- Play icon with morphing scale -->
            <svg
                class="absolute h-16 w-16 transition-all duration-300"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                style={`filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3)); opacity: ${isPlaying ? 0 : 1}; transform: scale(${isPlaying ? 0.7 : 1}); pointer-events: none;`}>
                <!-- Play triangle -->
                <polygon points="5,3 20,12 5,21" fill="white" />
            </svg>

            <!-- Pause icon with morphing scale -->
            <svg
                class="absolute h-16 w-16 transition-all duration-300"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                style={`filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3)); opacity: ${isPlaying ? 1 : 0}; transform: scale(${isPlaying ? 1 : 0.7}); pointer-events: none;`}>
                <!-- Pause bars -->
                <rect x="5" y="4" width="3" height="16" rx="1" fill="white" />
                <rect x="16" y="4" width="3" height="16" rx="1" fill="white" />
            </svg>
        </div>
    {/if}

    <style>
    </style>

    <!-- Controls Overlay -->
    <div
        class={cn(
            "pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300",
            !showControls && "opacity-0",
            "flex flex-col justify-between p-4",
        )}>
        <!-- Top Bar -->
        <div class="flex items-center justify-between">
            {#if title}
                <h3 class="text-sm font-medium text-white">{title}</h3>
            {:else}
                <div />
            {/if}
        </div>

        <!-- Bottom Controls -->
        <div class="space-y-3">
            <!-- Progress Bar -->
            <div
                class="pointer-events-auto h-1 cursor-pointer rounded-full bg-white/30 transition-all hover:h-2"
                onclick={handleProgressClick}
                role="slider"
                aria-label="Video progress"
                aria-valuenow={Math.round((currentTime / duration) * 100)}
                aria-valuemin="0"
                aria-valuemax="100"
                tabindex="0">
                <div
                    class="bg-primary h-full rounded-full transition-[width] duration-100"
                    style={`width: ${duration ? (currentTime / duration) * 100 : 0}%`} />
            </div>

            <!-- Controls -->
            <div class="pointer-events-auto flex items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                    <!-- Play/Pause Button -->
                    <Button
                        size="sm"
                        variant="ghost"
                        class="h-8 w-8 p-0 text-white hover:bg-white/20"
                        onclick={togglePlay}
                        title={isPlaying ? "Pause" : "Play"}
                        aria-label={isPlaying ? "Pause video" : "Play video"}>
                        {#if isPlaying}
                            <Pause class="h-4 w-4" fill="currentColor" />
                        {:else}
                            <Play class="ml-0.5 h-4 w-4" fill="currentColor" />
                        {/if}
                    </Button>

                    <!-- Volume Control -->
                    <div class="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            class="h-8 w-8 p-0 text-white hover:bg-white/20"
                            onclick={toggleMute}
                            title={isMuted ? "Unmute" : "Mute"}
                            aria-label={isMuted ? "Unmute audio" : "Mute audio"}>
                            {#if isMuted}
                                <VolumeX class="h-4 w-4" />
                            {:else}
                                <Volume2 class="h-4 w-4" />
                            {/if}
                        </Button>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={volume}
                            onchange={handleVolumeChange}
                            class="accent-primary h-1 w-16 cursor-pointer appearance-none rounded-full bg-white/30"
                            title="Volume"
                            aria-label="Volume control" />
                    </div>

                    <!-- Time Display -->
                    <span class="ml-2 min-w-[60px] font-mono text-xs text-white">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                </div>

                <!-- Fullscreen Button -->
                <Button
                    size="sm"
                    variant="ghost"
                    class="h-8 w-8 p-0 text-white hover:bg-white/20"
                    onclick={toggleFullscreen}
                    title="Fullscreen"
                    aria-label="Toggle fullscreen">
                    <Maximize2 class="h-4 w-4" />
                </Button>
            </div>
        </div>
    </div>
</div>

<style>
    input[type="range"]::-webkit-slider-thumb {
        appearance: none;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: white;
        cursor: pointer;
        box-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
    }

    input[type="range"]::-moz-range-thumb {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: white;
        cursor: pointer;
        border: none;
        box-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
    }
</style>
