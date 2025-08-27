<script lang="ts">
	import type { LiveUser } from "$src/lib/shared-models";
	import { ArrowDown, Gamepad2 } from "@lucide/svelte";
	import { fly } from "svelte/transition";
	import UserStatusDot from "./UserStatusDot.svelte";
	import { goto } from "$app/navigation";
	import Progress from "../ui/progress/progress.svelte";
	import AvatarDiscord from "./AvatarDiscord.svelte";
	import { tick } from "svelte";

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

	// attend que la vidéo ait des données avant de tenter play()
	function waitCanPlay(el: HTMLVideoElement) {
		return new Promise<void>((resolve) => {
			if (el.readyState >= 2) return resolve(); // HAVE_CURRENT_DATA
			const on = () => {
				el.removeEventListener("loadeddata", on);
				resolve();
			};
			el.addEventListener("loadeddata", on, { once: true });
		});
	}

	async function handleMouseEnter() {
		if (!shouldShowMedia) return;
		hovering = true;
		const myToken = ++playToken;
		await tick(); // bind:this

		if (!videoEl) return;
		// si le src a changé par erreur, on le remet (défensif)
		if (videoEl.currentSrc !== videoUrl && videoEl.src !== videoUrl) {
			videoEl.src = videoUrl;
			videoEl.load();
		}

		await waitCanPlay(videoEl);
		if (myToken !== playToken) return; // annulé entre-temps

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
		playToken++; // annule toute lecture en cours
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
			<UserStatusDot status={user.status} class="absolute -bottom-0 -right-0" />
		</div>

		<div class="flex min-h-8 flex-col justify-center overflow-hidden text-start">
			<span class:text-primary={user.role === "admin"} class="font-ggsans-medium text-base font-thin leading-tight">
				{user.name}
			</span>

			{#if shouldShowMedia}
				<!-- Image de base (toujours visible derrière) -->
				<img
					src={posterUrl}
					alt={user.activity?.gameTitle || user.name}
					class="pointer-events-none absolute right-0 h-full rounded-xl object-cover"
					style="background: linear-gradient(90deg, transparent 0%, rgba(0, 128, 183, 0.08) 20%, rgba(0, 128, 183, 0.08) 50%, rgba(0, 128, 183, 0.2) 100%);" />

				<!-- Vidéo : URL fixe; on ne change que l'opacité + play/pause -->
				<video
					bind:this={videoEl}
					src={videoUrl}
					muted
					playsinline
					loop
					preload="metadata"
					poster={posterUrl}
					class="pointer-events-none absolute right-0 h-full rounded-xl object-cover transition-opacity duration-200 ease-linear"
					style={`opacity:${hovering ? 0.8 : 0}; background: linear-gradient(90deg, transparent 0%, rgba(0,128,183,.08) 20%, rgba(0,128,183,.08) 50%, rgba(0,128,183,.2) 100%);`}>
				</video>
			{/if}

			{#if user.activity && user.activity.activityType !== "Idle" && user.status !== "Disconnected"}
				<div
					transition:fly={{ y: -10, duration: 300 }}
					class="z-20 flex items-center gap-1 overflow-hidden text-xs font-bold text-gray-500">
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
</style>
