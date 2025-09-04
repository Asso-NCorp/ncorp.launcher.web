<script lang="ts">
    import AvatarDiscord from "./AvatarDiscord.svelte";
    import UserStatusDot from "./UserStatusDot.svelte";
    import AdminStatusDot from "./AdminStatusDot.svelte";
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
        src={`/api/avatars/${user.id}`}
        alt={user.name}
        {decorationSrc}
        ring={isSpeaking} />
    {#if showStatusDot}
        {#if user.role === "admin"}
            <AdminStatusDot {user} />
        {:else}
            <UserStatusDot {status} />
        {/if}
    {/if}
</div>
