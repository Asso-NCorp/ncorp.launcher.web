<script lang="ts">
    import Button from "$lib/components/ui/button/button.svelte";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher<{ send: { content: string }; attach: { files: File[] } }>();

    let {
        value = $bindable(""),
        placeholder = "Message...",
        maxHeight = 200,
        autoFocus = false,
        disabled = false,
        clearOnSend = true,
    }: {
        value?: string;
        placeholder?: string;
        maxHeight?: number;
        autoFocus?: boolean;
        disabled?: boolean;
        clearOnSend?: boolean;
    } = $props();

    let textareaEl: HTMLTextAreaElement;
    let fileInputEl: HTMLInputElement;

    function autoSize() {
        if (!textareaEl) return;
        textareaEl.style.height = "auto";
        textareaEl.style.height = Math.min(textareaEl.scrollHeight, maxHeight) + "px";
    }
    $effect(() => {
        value;
        autoSize();
    });

    function insertAtCursor(text: string) {
        if (!textareaEl) return;
        const start = textareaEl.selectionStart;
        const end = textareaEl.selectionEnd;
        value = value.slice(0, start) + text + value.slice(end);
        queueMicrotask(() => {
            textareaEl.selectionStart = textareaEl.selectionEnd = start + text.length;
            autoSize();
        });
    }

    function send() {
        const content = value.trim();
        if (!content || disabled) return;
        dispatch("send", { content }); // CHANGED
        if (clearOnSend) {
            value = "";
            autoSize();
        }
    }

    function keydown(e: KeyboardEvent) {
        if (e.key === "Enter") {
            const wantsNewLine = e.ctrlKey || e.metaKey || e.shiftKey || e.altKey;
            if (wantsNewLine) {
                e.preventDefault();
                insertAtCursor("\n");
            } else {
                e.preventDefault();
                send();
            }
        }
    }

    function chooseImage() {
        fileInputEl?.click();
    }

    function onFilesSelected(e: Event) {
        const input = e.target as HTMLInputElement;
        if (!input.files?.length) return;
        const files = Array.from(input.files);
        dispatch("attach", { files }); // CHANGED
    }

    function handlePaste(e: ClipboardEvent) {
        if (e.clipboardData) {
            const files = Array.from(e.clipboardData.files || []);
            if (files.length) {
                dispatch("attach", { files }); // CHANGED
            }
        }
    }

    function handleDrop(e: DragEvent) {
        e.preventDefault();
        if (e.dataTransfer?.files?.length) {
            const files = Array.from(e.dataTransfer.files);
            dispatch("attach", { files }); // CHANGED
        }
    }

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
    }

    function focusTextarea(e: MouseEvent) {
        if (textareaEl && e.target === e.currentTarget) textareaEl.focus();
    }
</script>

<div
    class="flex w-full cursor-text rounded-md border border-input bg-background-darker px-3 py-2 text-base ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    ondrop={handleDrop}
    ondragover={handleDragOver}
    onclick={focusTextarea}>
    <div class="flex flex-1 items-center gap-2">
        <!-- CHANGED items-end -> items-center -->
        <DropdownMenu.Root>
            <DropdownMenu.Trigger>
                <Button
                    variant="ghost"
                    size="icon"
                    class="h-9 w-9 shrink-0 rounded-md border border-transparent hover:border-[hsl(var(--border))]"
                    aria-label="Pièces jointes"
                    {disabled}>
                    <span class="text-xl font-semibold leading-none">+</span>
                </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content class="w-44">
                <DropdownMenu.Item onclick={chooseImage}>Image...</DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item disabled class="text-xs text-muted-foreground">
                    Bientôt: Fichier, Clip
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu.Root>

        <input bind:this={fileInputEl} type="file" accept="image/*" class="hidden" onchange={onFilesSelected} />

        <textarea
            bind:this={textareaEl}
            bind:value
            class="scrollbar-thin max-h-[200px] min-h-[42px] flex-1 resize-none bg-transparent px-1 py-3 text-sm leading-snug outline-none placeholder:opacity-60"
            {placeholder}
            onkeydown={keydown}
            onpaste={handlePaste}
            {disabled}
            autofocus={autoFocus}
            aria-label="Composer un message"
            rows="1" />
    </div>
</div>

<style>
    /* subtle custom scrollbar inside the composer (if overflow) */
    .scrollbar-thin::-webkit-scrollbar {
        width: 6px;
    }
    .scrollbar-thin::-webkit-scrollbar-track {
        background: transparent;
    }
    .scrollbar-thin::-webkit-scrollbar-thumb {
        background: hsl(var(--muted-foreground) / 0.3);
        border-radius: 4px;
    }
    .scrollbar-thin::-webkit-scrollbar-thumb:hover {
        background: hsl(var(--muted-foreground) / 0.5);
    }
</style>
