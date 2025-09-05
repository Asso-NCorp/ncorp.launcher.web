<script lang="ts">
    import Input from "$lib/components/ui/input/input.svelte";
    import { Button } from "$lib/components/ui/button";
    import { Paperclip } from "@lucide/svelte";
    import { onDestroy } from "svelte";
    import { cn } from "$src/lib/utils";

    // callbacks
    let {
        placeholder = "Écrire un message…",
        disabled = false,
        onsend,
        ontyping,
        onblur,
        class: klazz = "",
    }: {
        placeholder?: string;
        disabled?: boolean;
        onsend?: (msg: string) => void;
        ontyping?: (state: boolean) => void;
        onblur?: () => void;
        class?: string;
    } = $props();

    let value = $state("");
    const TYPING_STOP_MS = 3000;
    let stopTimer: ReturnType<typeof setTimeout> | null = null;

    function emitTyping() {
        ontyping?.(true);
        if (stopTimer) clearTimeout(stopTimer);
        stopTimer = setTimeout(() => ontyping?.(false), TYPING_STOP_MS);
    }

    function submit() {
        const v = value.trim();
        if (!v) return;
        onsend?.(v);
        value = "";
        if (stopTimer) clearTimeout(stopTimer);
        ontyping?.(false);
    }

    onDestroy(() => stopTimer && clearTimeout(stopTimer));
</script>

<form class={cn("flex items-center gap-2 border-t p-3", klazz)} on:submit|preventDefault={submit}>
    <Button type="button" variant="ghost" size="icon" aria-label="Pièce jointe">
        <Paperclip class="h-4 w-4" />
    </Button>

    <Input
        class="w-100 flex-1"
        bind:value
        {placeholder}
        {disabled}
        maxlength={2000}
        oninput={emitTyping}
        onkeydown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
            }
        }}
        onblur={() => {
            onblur?.(); // 👈 remonte au parent
        }} />
</form>
