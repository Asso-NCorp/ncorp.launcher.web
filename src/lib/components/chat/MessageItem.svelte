<script lang="ts">
    import { cn } from "$lib/utils";
    import type { MessageDto } from "$src/lib/shared-models";
    import { global } from "$src/lib/states/global.svelte";
    import { liveUsers } from "$src/lib/states/live-users.svelte";
    import { Ellipsis } from "@lucide/svelte";
    import AvatarWithStatus from "../custom/AvatarWithStatus.svelte";
    import Button from "../ui/button/button.svelte";
    import { page } from "$app/state";
    import type { role } from "@prisma/client";
    import { transformMessageContent } from "$lib/utils/messageContentMiddleware";

    // === Props ===
    const {
        msg,
        authorName,
        onReact,
        previousAuthorId = null,
        previousCreatedAt = null,
        showDaySeparator = false,
        dayLabel = "",
    } = $props<{
        msg: MessageDto;
        authorName?: string;
        onReact?: (e: { messageId: string; emoji: string }) => void;
        previousAuthorId?: string | null;
        previousCreatedAt?: string | null;
        showDaySeparator?: boolean;
        dayLabel?: string;
    }>();

    // === User / roles ===
    var roles = (page.data["roles"] as role[]) || [];
    const user = liveUsers.getUser(msg.authorId);
    const userRole = roles.find((r) => r.name === user?.role);
    let hovering = $state(false);

    let avatarDecorationSrc = $derived(() => {
        if (!userRole) return undefined;
        const staticDeco = userRole.avatar_decoration_static;
        const animatedDeco = userRole.avatar_decoration_animated;
        if (hovering) return animatedDeco ?? staticDeco ?? undefined;
        return staticDeco ?? animatedDeco ?? undefined;
    });

    // === Emojis ===
    const quickEmojis = ["😂", "👍", "❤️"];
    const allEmojis = ["👍", "😂", "🔥", "🎉", "😮", "❤️", "👀", "😢", "🔥", "💀", "🤣", "😭", "🍆"];
    let showPicker = $state(false);

    function toggleReaction(emoji: string) {
        onReact?.({ messageId: msg.id, emoji });
        showPicker = false;
    }
    function togglePicker() {
        showPicker = !showPicker;
    }

    // === Dates ===
    function fmtTime(iso: string) {
        const d = new Date(iso);
        const pad = (n: number) => n.toString().padStart(2, "0");
        return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    function fmtRel(iso: string) {
        const d = new Date(iso);
        const now = new Date();
        const time = fmtTime(iso);
        const same =
            d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
        if (same) return time;
        const y = new Date(now);
        y.setHours(0, 0, 0, 0);
        y.setDate(y.getDate() - 1);
        const isY = d.getFullYear() === y.getFullYear() && d.getMonth() === y.getMonth() && d.getDate() === y.getDate();
        return isY ? `Hier à ${time}` : time;
    }

    const formattedTimestamp = $derived(fmtRel(msg.createdAt));
    const msgDateKey = $derived(new Date(msg.createdAt).toDateString());
    const prevDateKey = $derived(previousCreatedAt ? new Date(previousCreatedAt).toDateString() : null);
    const startsNewGroup = $derived(
        !previousAuthorId || previousAuthorId !== msg.authorId || prevDateKey !== msgDateKey,
    );
    const showAvatar = $derived(startsNewGroup);
    const showHeader = $derived(startsNewGroup);

    const processedContent = $derived(transformMessageContent(msg.content || ""));
</script>

{#if showDaySeparator}
    <div class="my-4 flex items-center gap-2 px-4 text-xs text-muted-foreground">
        <div class="h-px flex-1 bg-border"></div>
        <span class="whitespace-nowrap">{dayLabel}</span>
        <div class="h-px flex-1 bg-border"></div>
    </div>
{/if}

<div class="group hover:bg-muted/80" onmouseenter={() => (hovering = true)} onmouseleave={() => (hovering = false)}>
    <div class={cn("relative flex px-4 py-[1px]")} id={`msg-${msg.id}`}>
        <!-- Quick reactions + picker -->
        <div
            class="pointer-events-none absolute right-2 top-2 flex gap-1 rounded-[0.25rem] border bg-background/80 p-[2px] opacity-0 drop-shadow transition group-hover:opacity-100">
            {#each quickEmojis as e}
                <Button
                    variant="ghost"
                    class="pointer-events-auto flex h-7 w-7 items-center justify-center rounded text-base hover:bg-muted"
                    onclick={() => toggleReaction(e)}
                    title={`Réagir avec ${e}`}>
                    {e}
                </Button>
            {/each}
            <Button
                variant="ghost"
                class="pointer-events-auto flex h-7 w-7 items-center justify-center rounded text-base hover:bg-muted"
                onclick={togglePicker}
                aria-expanded={showPicker}
                title="Plus de réactions">
                <Ellipsis />
            </Button>

            {#if showPicker}
                <div
                    class="pointer-events-auto absolute right-0 top-9 z-30 flex w-52 flex-wrap gap-1 rounded-md border bg-popover p-2 shadow-md"
                    onclick={(e) => e.stopPropagation()}>
                    {#each allEmojis as e}
                        <Button
                            variant="ghost"
                            class="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-muted"
                            onclick={() => toggleReaction(e)}
                            title={`Réagir avec ${e}`}>
                            {e}
                        </Button>
                    {/each}
                </div>
            {/if}
        </div>

        <!-- Col avatar / time -->
        <div class="flex w-10 justify-center pt-1">
            {#if showAvatar}
                <AvatarWithStatus
                    user={user!}
                    decorationSrc={avatarDecorationSrc()}
                    isSpeaking={false}
                    size={40}
                    showStatusDot={false}
                    status={user?.status} />
            {:else}
                <span
                    class="pointer-events-none select-none text-[11px] text-muted-foreground opacity-0 transition group-hover:opacity-100">
                    {fmtTime(msg.createdAt)}
                </span>
            {/if}
        </div>

        <!-- Corps -->
        <div class="ml-3 min-w-0 flex-1">
            {#if showHeader}
                <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold">{authorName ?? msg.authorId}</span>
                    <span class="text-[11px] text-muted-foreground">{formattedTimestamp}</span>
                </div>
            {/if}

            {#if msg.content}
                <div class="whitespace-pre-wrap break-words">
                    {#each processedContent as part}
                        {#if part.type === "text"}
                            <span>{part.text}</span>
                        {:else if part.type === "emoji"}
                            <span class="inline-block align-text-bottom">{part.char}</span>
                        {:else if part.type === "link"}
                            <a
                                href={part.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="break-all text-primary underline hover:opacity-80">
                                {part.display}
                            </a>
                        {:else if part.type === "image"}
                            <a
                                href={part.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="group inline-block max-w-xs align-top">
                                <img
                                    src={part.url}
                                    alt="image"
                                    loading="lazy"
                                    class="my-1 rounded border border-border group-hover:opacity-90" />
                            </a>
                        {/if}
                    {/each}
                </div>
            {/if}

            <!-- Réactions: msg.reactions = [{emoji, count, me}] -->
            <div class="flex flex-wrap items-center gap-1 py-1">
                {#each msg.reactions ?? [] as r}
                    <Button
                        type="button"
                        variant="outline"
                        onclick={() => toggleReaction(r.emoji)}
                        class={cn(
                            "flex h-6 items-center gap-1 rounded-[0.5rem] px-2 text-xs transition hover:bg-muted/50",
                            r.me ? "bg-blue-500/20 text-primary-foreground" : "",
                        )}
                        aria-pressed={r.me}
                        title={`Réagir avec ${r.emoji}`}>
                        <span>{r.emoji}</span>
                        <span>{r.count}</span>
                    </Button>
                {/each}
            </div>
        </div>
    </div>
</div>
