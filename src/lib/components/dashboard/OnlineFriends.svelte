<script lang="ts">
    import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import AvatarDiscord from "$lib/components/custom/AvatarDiscord.svelte";
    import * as Tooltip from "$lib/components/ui/tooltip";

    interface OnlineUser {
        userId: string;
        username: string;
        displayUsername?: string;
        status?: string;
        currentGame?: string;
    }

    let { onlineUsers }: { onlineUsers: OnlineUser[] } = $props();
</script>

{#if onlineUsers && onlineUsers.length > 0}
    <Card>
        <CardHeader class="pb-4">
            <CardTitle class="flex items-center gap-2">
                <iconify-icon icon="mdi:account-circle" class="text-green-500"></iconify-icon>
                Joueurs en ligne ({onlineUsers.length})
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {#each onlineUsers.slice(0, 6) as user}
                    <Tooltip.Root>
                        <Tooltip.Trigger>
                            <div
                                class="border-muted/50 bg-muted/30 flex items-center gap-3 rounded-lg border p-3 transition-all duration-200 hover:border-green-500/50 hover:bg-green-500/5">
                                <div class="relative">
                                    <AvatarDiscord
                                        size={36}
                                        name={user.username}
                                        src={`/api/avatars/${user.userId}`}
                                        alt={user.username} />
                                    <div
                                        class="border-background absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 bg-green-500" />
                                </div>
                                <div class="min-w-0 flex-1">
                                    <p class="truncate text-sm font-medium">
                                        {user.displayUsername || user.username}
                                    </p>
                                    {#if user.currentGame}
                                        <p class="text-muted-foreground truncate text-xs">{user.currentGame}</p>
                                    {:else}
                                        <p class="text-success text-xs">En ligne</p>
                                    {/if}
                                </div>
                            </div>
                        </Tooltip.Trigger>
                        <Tooltip.Content>
                            <p class="text-sm font-medium">{user.displayUsername || user.username}</p>
                            {#if user.currentGame}
                                <p class="text-muted-foreground text-xs">Joue à {user.currentGame}</p>
                            {/if}
                        </Tooltip.Content>
                    </Tooltip.Root>
                {/each}
            </div>
            {#if onlineUsers.length > 6}
                <p class="text-muted-foreground mt-3 text-center text-xs">
                    + {onlineUsers.length - 6} autre joueur{onlineUsers.length - 6 > 1 ? "s" : ""} en ligne
                </p>
            {/if}
        </CardContent>
    </Card>
{/if}
