<script lang="ts">
	import { onMount, onDestroy, tick } from "svelte";
	import LazyImage from "./LazyImage.svelte";
	import Loader from "./Loader.svelte";
	import type { InstallableGameExtended } from "$src/lib/types";
	import Button from "../ui/button/button.svelte";
	import { cn, getGameResourceUrl } from "$src/lib/utils";
	import { getGameTrailer } from "$src/lib/backend";
    import { PUBLIC_BACKEND_API_URL } from "$env/static/public";

	let {
		games = [],
		interval = 6000,
		autoplay = true,
		loading = false,
		minHeight = 360,
		class: klass,
	}: {
		games: InstallableGameExtended[];
		interval?: number;
		autoplay?: boolean;
		loading?: boolean;
		minHeight?: number;
		class?: string;
	} = $props();

	let current = $state(0);
	let startTs = 0;
	let elapsed = $state(0);
	let raf: number | null = null;
	let paused = $state(false);

	let trailers: Record<number, string | null> = {};
	let playingVideo = $state(false);
	let videoProgress = $state(0); // ✅ progression de la vidéo

	const playedTrailers = new Set<number>(
		JSON.parse(localStorage.getItem("playedTrailers") || "[]")
	);

	function savePlayed() {
		localStorage.setItem("playedTrailers", JSON.stringify([...playedTrailers]));
	}

	async function ensureTrailerLoaded(game: InstallableGameExtended) {
		if (!game.steamAppId) return null;
		if (trailers[game.steamAppId] !== undefined) return trailers[game.steamAppId];

		try {
			const trailer = await getGameTrailer({
                baseUrl: PUBLIC_BACKEND_API_URL,
				query: { steamAppId: game.steamAppId },
			});
			trailers[game.steamAppId] = trailer?.data || null;
			return trailers[game.steamAppId];
		} catch {
			trailers[game.steamAppId] = null;
			return null;
		}
	}

	function wrapIndex(i: number, len: number) {
		return ((i % len) + len) % len;
	}

	async function goto(i: number) {
		if (!games.length) return;
		current = wrapIndex(i, games.length);
		elapsed = 0;
		startTs = performance.now();
		playingVideo = false;
		videoProgress = 0;
		await tryPlayTrailer(games[current]);
	}

	const next = async () => await goto(current + 1);
	const prev = async () => await goto(current - 1);

	async function tryPlayTrailer(game: InstallableGameExtended) {
		const id = game.steamAppId;
		if (!id || playedTrailers.has(id)) return;

		const url = await ensureTrailerLoaded(game);
		if (!url) return;

		await tick();
		const video = document.querySelector<HTMLVideoElement>(`#slide-video-${current}`);
		const img = document.querySelector<HTMLDivElement>(`#slide-image-${current}`);
		if (!video || !img) return;

		if (!video.querySelector("source")) {
			const src = document.createElement("source");
			src.src = url;
			src.type = "video/webm";
			video.appendChild(src);
		}

		video.onended = () => {
			playedTrailers.add(id);
			savePlayed();
			videoProgress = 0;
			playingVideo = false;

			video.pause();
			video.removeAttribute("src");
			video.load();
			video.remove();
			img.style.opacity = "1";

			next();
		};

		video.ontimeupdate = () => {
			if (video.duration && !isNaN(video.duration)) {
				videoProgress = Math.min(1, video.currentTime / video.duration);
			}
		};

		img.style.transition = "opacity 0.6s ease";
		video.style.transition = "opacity 0.6s ease";
		img.style.opacity = "0";
		video.style.opacity = "1";

		await video.play().catch((e) => console.warn("Error playing trailer:", e));
		playingVideo = true;
	}

	function frame(ts: number) {
		if (!paused && autoplay && games.length && !playingVideo) {
			elapsed = ts - startTs;
			if (elapsed >= interval) {
				next();
				elapsed = 0;
			}
		} else if (!playingVideo) {
			startTs = ts - elapsed;
		}
		raf = requestAnimationFrame(frame);
	}

	onMount(async () => {
		await ensureTrailerLoaded(games[0]);
		await tryPlayTrailer(games[0]);
		startTs = performance.now();
		raf = requestAnimationFrame(frame);
	});

	onDestroy(() => raf && cancelAnimationFrame(raf));

	const key = (e: KeyboardEvent) => {
		if (e.key === "ArrowRight") next();
		else if (e.key === "ArrowLeft") prev();
	};

	const mainImage = (g: InstallableGameExtended) => {
		const shot = g?.screenshots?.[0];
		const img = shot || g?.cover;
		return img ? getGameResourceUrl(g, img) : "";
	};

	const thumbImage = (g: InstallableGameExtended) =>
		g?.cover
			? getGameResourceUrl(g, g.cover)
			: g?.screenshots?.[0]
			? getGameResourceUrl(g, g.screenshots[0])
			: "";

	const logoImage = (g: InstallableGameExtended) => getGameResourceUrl(g, g.logo);
	const progress = $derived(
		playingVideo
			? videoProgress
			: games.length
			? Math.min(1, elapsed / interval)
			: 0
	);

	$effect(() => {
		if (current >= games.length) current = games.length ? games.length - 1 : 0;
	});
</script>

<div
	class={cn(
		"group bg-card ring-border relative box-border aspect-video w-full max-w-full overflow-hidden ring-1",
		klass,
	)}
	style={`min-height:${minHeight}px;`}
	tabindex="0"
	onkeydown={key}
	onfocus={() => (paused = true)}
	onblur={() => (paused = false)}>

	{#if loading}
		<div class="from-background via-muted to-background absolute inset-0 animate-pulse bg-linear-to-br" />
	{:else if !games.length}
		<div class="absolute inset-0 flex items-center justify-center text-sm opacity-70">
			No featured games
		</div>
	{:else}
		{#each games as g, i}
			<div
				class="absolute inset-0 transition-opacity duration-700"
				style="opacity:{i === current ? 1 : 0}"
				class:pointer-events-none={i !== current}>

				<!-- image -->
				<div id={"slide-image-" + i} class="absolute inset-0 opacity-100 z-0">
					{#if mainImage(g)}
						<LazyImage
							src={mainImage(g)}
							placeholderHeight="100%"
							placeholderWidth="100%"
							class="h-full w-full object-cover">
							<Loader size={32} />
						</LazyImage>
					{:else}
						<div class="bg-secondary flex h-full w-full items-center justify-center text-xl">
							{g.title}
						</div>
					{/if}
				</div>

				<!-- vidéo -->
				<video
					id={"slide-video-" + i}
					class="absolute inset-0 h-full w-full object-cover opacity-0"
					muted
					playsinline
					preload="auto" />

				<!-- dégradés -->
				<div class="absolute inset-x-0 top-0 h-[60%] bg-linear-to-b from-black/70 via-black/40 to-transparent"></div>
				<div class="absolute inset-x-0 bottom-0 h-1/2"
					style="background:linear-gradient(to top,hsl(var(--background)/0.85) 0%,hsl(var(--background)/0.55) 55%,hsl(var(--background)/0) 100%);"></div>
				<div class="absolute inset-y-0 left-0 w-1/3"
					style="background:linear-gradient(to right,hsl(var(--background)/0.70) 0%,hsl(var(--background)/0.45) 45%,hsl(var(--background)/0) 100%);"></div>

				<!-- texte -->
				<div class="text-foreground absolute right-auto bottom-16 left-0 z-20 flex max-w-xl flex-col gap-2 p-6">
					<h2 class="text-2xl font-bold drop-shadow">
						{#if logoImage(g)}
							<img src={logoImage(g)} alt={g.title + ' logo'}
								class="h-26 w-auto max-w-full object-contain drop-shadow-md" />
						{:else}
							{g.title}
						{/if}
					</h2>
					{#if g.description}
						<p class="text-sm leading-relaxed wrap-break-word whitespace-pre-line opacity-90">
							{g.description}
						</p>
					{/if}
				</div>
			</div>
		{/each}

		<!-- boutons navigation -->
		<Button type="button" variant="ghost"
			class="bg-background/50 text-foreground hover:bg-background/70 absolute top-1/2 left-2 z-30 grid h-9 w-9 -translate-y-1/2 place-content-center rounded-md opacity-0 transition-opacity duration-200 group-hover:opacity-100"
			onclick={prev} aria-label="Previous">‹</Button>
		<Button type="button" variant="ghost"
			class="bg-background/50 text-foreground hover:bg-background/70 absolute top-1/2 right-2 z-30 grid h-9 w-9 -translate-y-1/2 place-content-center rounded-md opacity-0 transition-opacity duration-200 group-hover:opacity-100"
			onclick={next} aria-label="Next">›</Button>

		<!-- miniatures -->
		<div class="absolute right-0 bottom-0 left-0 flex justify-center gap-2 px-4 pb-2"
			onmouseenter={() => (paused = true)}
			onmouseleave={() => (paused = false)}>
			{#each games as g, i}
				<Button
					type="button"
					variant="ghost"
					aria-label={"Go to slide " + (i + 1)}
					class="group ring-border relative min-w-0 overflow-hidden rounded p-0 ring-1 focus:outline-none
					{i === current ? 'ring-primary ring-2' : ''} {g.cover ? 'aspect-2/3 h-16 w-12' : 'aspect-video h-12 w-20'}"
					onclick={() => goto(i)}>
					{#if thumbImage(g)}
						<LazyImage
							src={thumbImage(g)}
							alt={g.title + ' thumbnail'}
							class="block h-full w-full object-cover opacity-70 transition-opacity group-hover:opacity-100" />
					{:else}
						<span class="text-foreground/80 px-1 text-[10px] wrap-break-word">{g.title}</span>
					{/if}

					<!-- ✅ barre de progression dynamique -->
					<div class="bg-muted/40 absolute inset-x-0 bottom-0 h-1">
						<div
							class="bg-primary h-full transition-[width] duration-100"
							style={`width:${i === current ? progress * 100 : 0}%;`}>
						</div>
					</div>
				</Button>
			{/each}
		</div>
	{/if}
</div>
