<script lang="ts">
	import IntersectionObserver from "svelte-intersection-observer";
	import { chatStore } from "$src/lib/chat/chat.svelte";
	import type { MessageDto } from "$src/lib/shared-models";
	import MessageItem from "./MessageItem.svelte";
	import ScrollArea from "../ui/scroll-area/scroll-area.svelte";

	const {
		roomId,
		messages = [] as MessageDto[], // ASC
		loadMore,
		hasMore,
		authorNameOf,
		selfId
	} = $props<{
		roomId: string;
		messages?: MessageDto[];
		loadMore: (roomId: string) => Promise<void>;
		hasMore: boolean;
		authorNameOf: (id: string) => string | undefined;
		selfId: string;
	}>();

	// Refs (runes)
	let viewport = $state<HTMLElement | null>(null);
	let topEl = $state<HTMLDivElement | null>(null);
	let bottomEl = $state<HTMLDivElement | null>(null);

	// (optionnel) état IO bas si tu veux un badge
	let bottomIntersecting = $state(false);

	// ---- Non-réactifs (pas de re-run) ----
	let mounted = false;
	let prevCount = 0;
	let prevLastId: string | null = null;
	let pendingStick = false; // <= PERSISTANT entre .pre et .effect

	// utils scroll
	function m() {
		if (!viewport) return { top: 0, client: 0, height: 0, max: 0 };
		const top = viewport.scrollTop, client = viewport.clientHeight, height = viewport.scrollHeight;
		return { top, client, height, max: Math.max(0, height - client) };
	}
	function atBottomNow(tol = 12) {
		const { top, client, height } = m();
		return height - client - top <= tol;
	}
	function scrollToBottom(smooth = false) {
		if (!viewport) return;
		const { max } = m();
		smooth ? viewport.scrollTo({ top: max, behavior: "smooth" }) : (viewport.scrollTop = max);
	}

	// mount: descendre en bas une seule fois
	$effect(() => {
		if (mounted || !viewport) return;
		mounted = true;
		queueMicrotask(() => scrollToBottom(false));
	});

	// PREPEND via IO haut (≥ 50%) + conservation position
	async function handleTopIntersect(e: CustomEvent<IntersectionObserverEntry>) {
		if (!viewport || !hasMore) return;
		const entry = e.detail;
		if (!entry.isIntersecting || entry.intersectionRatio < 0.5) return;

		const before = m();
		await loadMore(roomId);
		const after = m();
		viewport.scrollTop = before.top + (after.height - before.height);
	}

	// données triées
	const display = $derived(
		[...messages].sort(
			(a, b) => new Date(a.createdAt as any).getTime() - new Date(b.createdAt as any).getTime()
		)
	);
	const grouped = $derived(() => {
		const arr = display;
		const out: { msg: MessageDto; previousAuthorId: string | null; previousCreatedAt: string | null }[] = [];
		for (let i = 0; i < arr.length; i++) {
			const m = arr[i], prev = i > 0 ? arr[i - 1] : null;
			out.push({ msg: m, previousAuthorId: prev?.authorId ?? null, previousCreatedAt: prev?.createdAt ?? null });
		}
		return out;
	});
	function messageGapClass(g: { previousAuthorId: string | null; msg: MessageDto }) {
		return g.previousAuthorId && g.previousAuthorId !== g.msg.authorId ? "pt-3" : "mt-0";
	}

	// --- Day separator helpers ---
	function isSameDay(a?: string | Date | null, b?: string | Date | null) {
		if (!a || !b) return false;
		const da = new Date(a as any), db = new Date(b as any);
		return (
			da.getFullYear() === db.getFullYear() &&
			da.getMonth() === db.getMonth() &&
			da.getDate() === db.getDate()
		);
	}
	function isYesterday(d: Date) {
		const y = new Date();
		y.setHours(0, 0, 0, 0);
		y.setDate(y.getDate() - 1);
		return d.getFullYear() === y.getFullYear() && d.getMonth() === y.getMonth() && d.getDate() === y.getDate();
	}
	function dayLabelOf(iso?: string | Date | null) {
		if (!iso) return "";
		const d = new Date(iso as any);
		const now = new Date();
		if (
			d.getFullYear() === now.getFullYear() &&
			d.getMonth() === now.getMonth() &&
			d.getDate() === now.getDate()
		)
			return "Aujourd’hui";
		if (isYesterday(d)) return "Hier";
		return d.toLocaleDateString(undefined, { day: "2-digit", month: "long", year: "numeric" });
	}
	function isDayChange(prevIso?: string | Date | null, curIso?: string | Date | null) {
		if (!curIso) return false;
		return !isSameDay(prevIso ?? null, curIso);
	}

	// -------- pipeline sans boucles --------

	// 1) AVANT DOM : armer le scroll si append & (en bas OU c’est mon message)
	$effect.pre(() => {
		void display.length; // dépendance unique
	if (!mounted || !viewport) return;

		// si déjà armé, ne JAMAIS désarmer ici (évite les courses)
		if (pendingStick) return;

		const count = display.length;
		const last = display.at(-1);
		const lastId = last?.id ?? null;

		const appended = count > prevCount && lastId !== prevLastId;
		if (!appended) return;

		const own = last?.authorId === selfId;
		const wasAtBottom = atBottomNow(16); // tolérance généreuse
		if (own || wasAtBottom) pendingStick = true;
	});

	// 2) APRÈS DOM : si armé → scroll, puis sync des marqueurs
	$effect(() => {
		void display.length;
	if (!mounted || !viewport) return;

		if (pendingStick) {
			scrollToBottom(true);
			pendingStick = false; // consommé
		}

		// sync "prev" (non-réactif)
		prevCount = display.length;
		prevLastId = display.at(-1)?.id ?? null;
	});
</script>

<ScrollArea bind:viewportRef={viewport} class="relative min-h-0 flex-1">
	<!-- sentinelle haut -->
	<IntersectionObserver element={topEl} root={viewport} threshold={0.5} on:intersect={handleTopIntersect}>
		<div bind:this={topEl} class="h-1 shrink-0" />
	</IntersectionObserver>

	<!-- messages -->
	<div class="mt-auto space-y-0">
		{#each grouped() as g (g.msg.id)}
			<div class={messageGapClass(g)} data-mid={g.msg.id}>
				<MessageItem
					msg={g.msg}
					authorName={authorNameOf(g.msg.authorId)}
					previousAuthorId={g.previousAuthorId}
					previousCreatedAt={g.previousCreatedAt}
					showDaySeparator={isDayChange(g.previousCreatedAt, g.msg.createdAt)}
					dayLabel={dayLabelOf(g.msg.createdAt)}
					onReact={({ messageId, emoji }) => chatStore.react(messageId, emoji)} />
			</div>
		{/each}
	</div>

	<!-- sentinelle bas (optionnel state UI) -->
	<IntersectionObserver element={bottomEl} root={viewport} threshold={0.99} bind:intersecting={bottomIntersecting}>
		<div bind:this={bottomEl} class="h-1 shrink-0" />
	</IntersectionObserver>
</ScrollArea>
