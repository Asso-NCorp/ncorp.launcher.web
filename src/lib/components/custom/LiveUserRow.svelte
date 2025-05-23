<script lang="ts">
    import * as Avatar from "$lib/components/ui/avatar/index.js";
    import type { LiveUser } from "$src/lib/shared-models";
    import { Gamepad2 } from "@lucide/svelte";
    import { fly } from "svelte/transition";
    import UserStatusDot from "./UserStatusDot.svelte";
    let { user }: { user: LiveUser } = $props();
</script>

<div class="flex h-10 w-full items-center justify-start gap-2">
    <div class="relative">
        <Avatar.Root class="size-8 ring-primary {user.isSpeaking ? 'ring' : 'ring-0'}">
            <Avatar.Image src="/api/avatars/{user.id}" alt={user.name} />
            <Avatar.Fallback class="text-muted-foreground">
                {user.name?.charAt(0)}{user.name?.charAt(1)}
            </Avatar.Fallback>
        </Avatar.Root>

        <!-- Status dot -->
        {#key user.status}
            <UserStatusDot status={user.status?.toString()!} />
        {/key}
    </div>
    <div class="flex min-h-8 flex-col justify-center text-start">
        <span class:text-primary={user.role === "admin"} class="text-lg leading-tight">{user.name}</span>
        <div
            class="flex items-center gap-1 overflow-hidden text-xs font-bold text-gray-500 transition-all duration-300 ease-in-out"
            style="height: {user.activity ? '1rem' : '0'}; opacity: {user.activity ? 1 : 0};">
            <Gamepad2 class="inline-block h-4 w-4 text-green-600" />
            <span class="truncate text-2xs">{user.activity || ""}</span>
        </div>
    </div>
</div>
