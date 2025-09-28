import { getContext, setContext, type Snippet } from 'svelte';

const key = Symbol('games-menu-slot');

interface SlotContext {
    head: Snippet | undefined;
    title: Snippet | undefined;
}

export function initHeadMenu() {
    const slots: SlotContext = $state({ head: undefined, title: undefined });
    return setContext(key, slots);
}

export function setHeadMenu(head: Snippet, title?: Snippet) {
    const context = getContext<SlotContext>(key);
    Object.assign(context, { head, title });
}

export function cleanHeadMenu() {
    try {
        const context = getContext<SlotContext>(key);
        if (context)
            Object.assign(context, { head: undefined, title: undefined });
    } catch (error) {
        // Context may not be available during component cleanup
        // This is safe to ignore as the component is being destroyed anyway
    }
}