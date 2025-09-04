<script lang="ts">
    import ChatHeader from "./ChatHeader.svelte";
    import MessageList from "./MessageList.svelte";
    import MessageInput from "./MessageInput.svelte";
    import TypingIndicator from "./TypingIndicator.svelte";
    import type { MessageDto } from "$lib/shared-models";
    import { liveUsers } from "$lib/states/live-users.svelte";
    import { chatStore } from "$src/lib/chat/chat.svelte";
    import { fly } from "svelte/transition";
    import { global } from "$src/lib/states/global.svelte";

    const {
        title = "",
        subtitle = "",
        roomId = null,
    } = $props<{
        title?: string;
        subtitle?: string;
        roomId?: string | null;
    }>();

    const effectiveRoomId = $derived(roomId ?? chatStore.currentRoomId);

    const messages = $derived(
        effectiveRoomId ? (chatStore.messagesByRoom[effectiveRoomId] ?? []) : ([] as MessageDto[]),
    );
    const hasMore = $derived(effectiveRoomId ? (chatStore.cursorsByRoom[effectiveRoomId] ?? null) !== null : false);

    function authorNameOf(id: string) {
        return liveUsers.getUser(id)?.name ?? "Unknown";
    }

    // Lire directement la Map pour la réactivité (on réassigne une new Map côté store)
    const typingUserIds = $derived(
        effectiveRoomId ? [...(chatStore.typingUsers[effectiveRoomId]?.keys?.() ?? [])] : [],
    );

    // Exclure l'utilisateur courant pour l'affichage
    const otherTypingUserIds = $derived(
        global.currentUser?.id ? typingUserIds.filter((id) => id !== global.currentUser.id) : typingUserIds,
    );

    const typingNames = $derived(otherTypingUserIds.map(authorNameOf));
    const typingCount = $derived(typingNames.length);

    const typingSuffix = $derived(
        typingCount === 0 ? "" : typingCount === 1 ? " est en train d'écrire…" : " écrivent…",
    );
</script>

<section class="flex flex-1 flex-col">
    <ChatHeader {title} {subtitle} />
    {#if effectiveRoomId}
        <MessageList
            roomId={effectiveRoomId}
            {messages}
            {hasMore}
            {authorNameOf}
            loadMore={(rid) => chatStore.loadMore(rid)} />
        <div class="px-3 text-xs text-muted-foreground">
            {#if typingCount > 0}
                <div transition:fly={{ y: 10, duration: 300 }} class="flex items-center gap-2">
                    <TypingIndicator size={6} spacing={3} speed={1200} />
                    <span>
                        {#if typingCount === 1}
                            <strong class="font-semibold">{typingNames[0]}</strong>
                            {typingSuffix}
                        {:else if typingCount === 2}
                            <strong class="font-semibold">{typingNames[0]}</strong>
                            et
                            <strong class="font-semibold">{typingNames[1]}</strong>
                            {typingSuffix}
                        {:else if typingCount === 3}
                            <strong class="font-semibold">{typingNames[0]}</strong>
                            ,
                            <strong class="font-semibold">{typingNames[1]}</strong>
                            et
                            <strong class="font-semibold">{typingNames[2]}</strong>
                            {typingSuffix}
                        {:else}
                            <strong class="font-semibold">{typingNames[0]}</strong>
                            ,
                            <strong class="font-semibold">{typingNames[1]}</strong>
                            et {typingCount - 2} autres{typingSuffix}
                        {/if}
                    </span>
                </div>
            {:else}
                <span class="invisible select-none">placeholder</span>
            {/if}
        </div>
        <!-- Assure-toi que MessageInput déclenche aussi typing:false sur blur/Enter -->
        <MessageInput
            onsend={(msg) => chatStore.send(msg)}
            ontyping={(state) => chatStore.setTyping(state)}
            onblur={() => chatStore.setTyping(false)} />
    {:else}
        <div class="grid flex-1 place-items-center text-muted-foreground">Sélectionner un salon</div>
    {/if}
</section>
