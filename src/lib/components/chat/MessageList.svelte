<script lang="ts">
    import { chatStore } from "$src/lib/chat/chat.svelte";
    import type { MessageDto } from "$src/lib/shared-models";
    import MessageItem from "./MessageItem.svelte";

    const {
        roomId,
        messages = [] as MessageDto[], // ASC (ancien -> récent)
        loadMore,
        hasMore,
        authorNameOf,
    } = $props<{
        roomId: string;
        messages?: MessageDto[]; // ASC
        loadMore: (roomId: string) => Promise<void>;
        hasMore: boolean;
        authorNameOf: (id: string) => string | undefined;
    }>();

    let scroller: HTMLDivElement;
    let topSentinel: HTMLDivElement;
    let bottomSentinel: HTMLDivElement;

    let topObserver: IntersectionObserver;
    let bottomObserver: IntersectionObserver;

    // état “aimanté”
    let isAtBottom = $state(true);
    let mounted = $state(false);

    // mesures avant maj DOM
    let prevScrollHeight = $state(0);
    let shouldStickToBottom = $state(false);
    let prevLastId: string | null = $state(null);

    function setupTopObserver() {
        topObserver?.disconnect();
        topObserver = new IntersectionObserver(
            async (entries) => {
                for (const e of entries) {
                    if (e.isIntersecting && hasMore) {
                        const prevHeight = scroller.scrollHeight;
                        await loadMore(roomId); // on PREPEND des anciens messages
                        // préserver la position visuelle après DOM update
                        const newHeight = scroller.scrollHeight;
                        scroller.scrollTop = newHeight - prevHeight + scroller.scrollTop;
                    }
                }
            },
            { root: scroller, threshold: 0.01 },
        );
        topObserver.observe(topSentinel);
    }

    function setupBottomObserver() {
        bottomObserver?.disconnect();
        bottomObserver = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    isAtBottom = e.isIntersecting;
                }
            },
            { root: scroller, threshold: 0.99 },
        );
        bottomObserver.observe(bottomSentinel);
    }

    function scrollToBottom(smooth = false) {
        if (!scroller) return;
        if (smooth && "scrollTo" in scroller) {
            scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
        } else {
            scroller.scrollTop = scroller.scrollHeight;
        }
    }

    // Setup (one-shot) via runes
    $effect(() => {
        if (mounted || !scroller) return;
        mounted = true;
        setupTopObserver();
        setupBottomObserver();
        scrollToBottom(false); // se coller en bas à l’ouverture

        return () => {
            topObserver?.disconnect();
            bottomObserver?.disconnect();
        };
    });

    // Mesures AVANT maj DOM quand messages change
    $effect.pre(() => {
        // référencer messages pour déclencher l’effet
        void messages.length;

        if (!mounted || !scroller) return;
        prevScrollHeight = scroller.scrollHeight;

        // on colle en bas uniquement si l’utilisateur y était déjà
        const lastId = displayMessages.at(-1)?.id ?? null;
        shouldStickToBottom = isAtBottom || lastId !== prevLastId;
    });

    // Après maj DOM : gérer l’aimantation
    $effect(() => {
        // référencer messages pour déclencher l’effet
        const last = displayMessages.at(-1);
        const lastId = last?.id ?? null;

        if (!mounted || !scroller) return;

        // mise à jour last id
        if (lastId && lastId !== prevLastId) prevLastId = lastId;

        // si on était au fond → rester collé au fond (nouveaux messages)
        if (shouldStickToBottom && isAtBottom) {
            scrollToBottom(true);
            return;
        }

        // sinon ne rien faire : l'utilisateur a scrolé vers le haut, on respecte.
    });

    const displayMessages = $derived(
        [...messages].sort((a, b) => new Date(a.createdAt as any).getTime() - new Date(b.createdAt as any).getTime()),
    );

    function dayKey(d: string) {
        const dt = new Date(d);
        return `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
    }

    function dayLabel(d: string) {
        return new Date(d).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    }

    const groupedMessages = $derived(() => {
        const arr = displayMessages;
        const out: {
            msg: MessageDto;
            previousAuthorId: string | null;
            previousCreatedAt: string | null;
            showDaySeparator: boolean;
            dayLabel: string;
        }[] = [];
        let lastDayKey: string | null = null;
        for (let i = 0; i < arr.length; i++) {
            const m = arr[i];
            const prev = i > 0 ? arr[i - 1] : null;
            const currentDayKey = dayKey(m.createdAt);
            const showDaySeparator = currentDayKey !== lastDayKey;
            if (showDaySeparator) lastDayKey = currentDayKey;
            out.push({
                msg: m,
                previousAuthorId: prev?.authorId ?? null,
                previousCreatedAt: prev?.createdAt ?? null,
                showDaySeparator,
                dayLabel: showDaySeparator ? dayLabel(m.createdAt) : "",
            });
        }
        return out;
    });

    // Marge verticale avant un message si changement d'auteur
    function messageGapClass(g: { previousAuthorId: string | null; msg: MessageDto }) {
        return g.previousAuthorId && g.previousAuthorId !== g.msg.authorId ? "pt-3" : "mt-0";
    }
</script>

<!-- Ordre normal (ASC), pas de flex-col-reverse -->
<div bind:this={scroller} class="flex flex-1 flex-col overflow-auto">
    <!-- New flex wrapper to allow bottom alignment -->
    <div class="flex min-h-full flex-col">
        <!-- Top sentinel (unchanged) -->
        <div bind:this={topSentinel} class="h-2 shrink-0"></div>

        <!-- Messages container pushed to bottom when there is extra space -->
        <div class="mt-auto space-y-0">
            {#each groupedMessages() as g, i (g.msg.id)}
                <div class={messageGapClass(g)}>
                    <MessageItem
                        msg={g.msg}
                        authorName={authorNameOf(g.msg.authorId)}
                        previousAuthorId={g.previousAuthorId}
                        previousCreatedAt={g.previousCreatedAt}
                        showDaySeparator={g.showDaySeparator}
                        onReact={({ messageId, emoji }) => chatStore.react(messageId, emoji)}
                        dayLabel={g.dayLabel} />
                </div>
            {/each}
        </div>

        <!-- Bottom sentinel (unchanged) -->
        <div bind:this={bottomSentinel} class="h-2 shrink-0"></div>
    </div>
</div>
