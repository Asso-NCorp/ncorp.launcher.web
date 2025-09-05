<script lang="ts">
	import IntersectionObserver from "svelte-intersection-observer";
	import { chatStore } from "$src/lib/chat/chat.svelte";
	import type { MessageDto } from "$src/lib/shared-models";
	import MessageItem from "./MessageItem.svelte";

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
	let scroller = $state<HTMLDivElement | null>(null);
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
		if (!scroller) return { top: 0, client: 0, height: 0, max: 0 };
		const top = scroller.scrollTop, client = scroller.clientHeight, height = scroller.scrollHeight;
		return { top, client, height, max: Math.max(0, height - client) };
	}
	function atBottomNow(tol = 12) {
		const { top, client, height } = m();
		return height - client - top <= tol;
	}
	function scrollToBottom(smooth = false) {
		if (!scroller) return;
		const { max } = m();
		smooth ? scroller.scrollTo({ top: max, behavior: "smooth" }) : (scroller.scrollTop = max);
	}

	// mount: descendre en bas une seule fois
	$effect(() => {
		if (mounted || !scroller) return;
		mounted = true;
		queueMicrotask(() => scrollToBottom(false));
	});

	// PREPEND via IO haut (≥ 50%) + conservation position
	async function handleTopIntersect(e: CustomEvent<IntersectionObserverEntry>) {
		if (!scroller || !hasMore) return;
		const entry = e.detail;
		if (!entry.isIntersecting || entry.intersectionRatio < 0.5) return;

		const before = m();
		await loadMore(roomId);
		const after = m();
		scroller.scrollTop = before.top + (after.height - before.height);
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

	// -------- pipeline sans boucles --------

	// 1) AVANT DOM : armer le scroll si append & (en bas OU c’est mon message)
	$effect.pre(() => {
		void display.length; // dépendance unique
		if (!mounted || !scroller) return;

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
		if (!mounted || !scroller) return;

		if (pendingStick) {
			scrollToBottom(true);
			pendingStick = false; // consommé
		}

		// sync "prev" (non-réactif)
		prevCount = display.length;
		prevLastId = display.at(-1)?.id ?? null;
	});
</script>

<div bind:this={scroller} class="relative min-h-0 flex-1 overflow-auto">
	<!-- sentinelle haut -->
	<IntersectionObserver element={topEl} root={scroller} threshold={0.5} on:intersect={handleTopIntersect}>
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
					onReact={({ messageId, emoji }) => chatStore.react(messageId, emoji)} />
			</div>
		{/each}
	</div>

	<!-- sentinelle bas (optionnel state UI) -->
	<IntersectionObserver element={bottomEl} root={scroller} threshold={0.99} bind:intersecting={bottomIntersecting}>
		<div bind:this={bottomEl} class="h-1 shrink-0" />
	</IntersectionObserver>
</div>
