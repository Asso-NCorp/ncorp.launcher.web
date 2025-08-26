<script lang="ts">
    import { ChatStore } from "$lib/states/chat.svelte";
    import dayjs from "dayjs";
    const messages = () => ChatStore.activeMessages;
    let container: HTMLDivElement;

    const DATE_FMT = "DD/MM/YYYY";
    const TIME_FMT = "HH:mm";

    function prev(i: number) {
        return i > 0 ? messages()[i - 1] : null;
    }
    function isSameDay(a: string, b: string) {
        return dayjs(a).isSame(b, "day");
    }
    function minutesDiff(a: string, b: string) {
        return dayjs(a).diff(b, "minute");
    }
    function startsNewDay(i: number) {
        const p = prev(i);
        if (!p) return true;
        return !isSameDay(messages()[i].created_at, p.created_at);
    }
    function startsNewGroup(i: number) {
        const m = messages()[i];
        const p = prev(i);
        if (!p) return true;
        if (startsNewDay(i)) return true;
        if (p.author_id !== m.author_id) return true;
        if (minutesDiff(m.created_at, p.created_at) >= 30) return true;
        return false;
    }
    function groupHeaderTimestamp(i: number) {
        const m = messages()[i];
        if (startsNewDay(i)) {
            return `${dayjs(m.created_at).format(DATE_FMT)} • ${dayjs(m.created_at).format(TIME_FMT)}`;
        }
        return dayjs(m.created_at).format(TIME_FMT);
    }
    function initials(name: string) {
        return name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p[0]?.toUpperCase())
            .join("");
    }

    $effect(() => {
        messages();
        queueMicrotask(() => {
            if (container) container.scrollTop = container.scrollHeight;
        });
    });
</script>

<div bind:this={container} class="flex-1 overflow-y-auto pr-2" role="log" aria-live="polite">
    <div class="flex min-h-full flex-col justify-end">
        {#if messages().length === 0}
            <p class="mt-4 text-center text-xs text-muted-foreground">Aucun message</p>
        {:else}
            {#each messages() as m, i (m.id)}
                {#if startsNewDay(i)}
                    <div class="my-4 flex items-center gap-4 px-4 text-[11px] font-medium text-muted-foreground">
                        <div class="h-px flex-1 bg-border" />
                        <span>{dayjs(m.created_at).format(DATE_FMT)}</span>
                        <div class="h-px flex-1 bg-border" />
                    </div>
                {/if}
                {#if startsNewGroup(i)}
                    <div class="group flex gap-3 rounded-md px-4 py-1 transition-colors hover:bg-muted/30">
                        <div class="relative w-10 flex-shrink-0">
                            <div
                                class="avatar flex h-9 w-9 select-none items-center justify-center overflow-hidden rounded-full bg-muted text-[11px] font-semibold text-foreground/80">
                                {initials(m.author_name)}
                            </div>
                        </div>
                        <div class="flex min-w-0 flex-1">
                            <div class="flex w-full flex-col gap-1">
                                <div class="flex flex-wrap items-baseline gap-2 leading-tight">
                                    <span class="font-semibold">{m.author_name}</span>
                                    <span class="text-[11px] text-muted-foreground">
                                        {groupHeaderTimestamp(i)}
                                    </span>
                                    {#if m.temp}<em class="text-[10px] text-muted-foreground">(envoi...)</em>{/if}
                                </div>
                                <div class="whitespace-pre-wrap break-words text-[13px] leading-snug">{m.content}</div>
                            </div>
                        </div>
                    </div>
                {:else}
                    <div class="group flex gap-3 rounded-md px-4 py-0.5 transition-colors hover:bg-muted/20">
                        <div class="w-10" />
                        <div class="min-w-0 flex-1">
                            <div class="whitespace-pre-wrap break-words text-[13px] leading-snug">
                                {m.content}
                                {#if m.temp}<em class="ml-2 text-[10px] text-muted-foreground">(envoi...)</em>{/if}
                            </div>
                        </div>
                    </div>
                {/if}
            {/each}
        {/if}
    </div>
</div>

<style>
    .avatar {
        box-shadow: 0 0 0 1px hsl(var(--border));
    }
</style>
