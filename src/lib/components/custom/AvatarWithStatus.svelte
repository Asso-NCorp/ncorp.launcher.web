<script lang="ts">
    import AvatarDiscord from "./AvatarDiscord.svelte";
    import UserStatusDot from "./UserStatusDot.svelte";
    import AdminStatusDot from "./AdminStatusDot.svelte";
    import { global } from "$lib/states/global.svelte";
    import type { LiveUser, UserConnectionType } from "$src/lib/shared-models";

    const {
        user,
        decorationSrc,
        isSpeaking = false,
        status,
        showStatusDot = true,
        size = 32,
    } = $props<{
        user: LiveUser;
        decorationSrc?: string;
        isSpeaking?: boolean;
        status?: UserConnectionType;
        showStatusDot?: boolean;
        size?: number | string;
    }>();
</script>

<div class="relative">
    <AvatarDiscord
        {size}
        name={user.name!}
        src={user.image}
        alt={user.name}
        {decorationSrc}
        ring={isSpeaking} />
    {#if showStatusDot}
        {#if global.currentUser?.role === "admin"}
            <AdminStatusDot {user} />
        {:else}
            <UserStatusDot {status} />
        {/if}
    {/if}
</div>
