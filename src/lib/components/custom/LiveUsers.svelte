<script lang="ts">
    import { liveUsers } from "$src/lib/states/live-users.svelte";
    import { cn } from "$src/lib/utils";
    import Loader from "./Loader.svelte";
    import ScrollArea from "../ui/scroll-area/scroll-area.svelte";
    import { t } from "$src/lib/translations";
    import LiveUserRow from "./LiveUserRow.svelte";
    import * as Popover from "../ui/popover";
    import * as Avatar from "$lib/components/ui/avatar/index.js";
    import type { LiveUser } from "$src/lib/shared-models";

    let { class: klazz }: { class?: string } = $props();

    let adminUsers: LiveUser[] = $derived(
        liveUsers.users
            .filter((user) => user.role === "admin")
            .sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    );
    let otherUsers: LiveUser[] = $derived(
        liveUsers.users
            .filter((user) => user.role !== "admin")
            .sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    );
</script>

<div class="h-full">
    <ScrollArea class={cn("h-full w-full", klazz)}>
        {#if liveUsers.loading}
            <div class="flex h-full w-full items-center justify-center">
                <Loader size={30} />
            </div>
        {:else if liveUsers.users.length === 0}
            <div class="flex h-full w-full items-center justify-center">
                <span class="text-lg text-secondary">{$t("no_users")}</span>
            </div>
        {:else}
            <div class="mt-2 flex w-full flex-col gap-2">
                {#if adminUsers.length > 0}
                    <h2 class="mb-1 mt-2 text-sm font-semibold text-muted-foreground">{$t("admins")}</h2>
                    {#each adminUsers as user}
                        <Popover.Root>
                            <Popover.Trigger><LiveUserRow {user} /></Popover.Trigger>
                            <Popover.Content side="right" align="start" sideOffset={-50} class="m-0 p-0 ">
                                <div class="relative h-96 bg-gray-800">
                                    <div class="absolute inset-0 h-1/5 bg-gradient-to-b from-gray-800 to-transparent">
                                    </div>
                                    <Avatar.Root
                                        class="absolute left-2 top-10 ring-primary {user.isSpeaking
                                            ? 'ring'
                                            : 'ring-0'}">
                                        <Avatar.Image src="/api/avatars/{user.id}" alt={user.name} />
                                        <Avatar.Fallback>{user.name?.charAt(0)}{user.name?.charAt(1)}</Avatar.Fallback>
                                    </Avatar.Root>
                                </div>
                            </Popover.Content>
                        </Popover.Root>
                    {/each}
                {/if}

                {#if adminUsers.length > 0 && otherUsers.length > 0}
                    <hr class="my-2 border-border" />
                {/if}

                {#if otherUsers.length > 0}
                    <h2 class="mb-1 mt-2 text-sm font-semibold text-muted-foreground">{$t("users")}</h2>
                    {#each otherUsers as user}
                        <Popover.Root>
                            <Popover.Trigger><LiveUserRow {user} /></Popover.Trigger>
                            <Popover.Content side="right" align="start" sideOffset={-50} class="m-0 p-0 ">
                                <div class="relative h-96 bg-gray-800">
                                    <div class="absolute inset-0 h-1/5 bg-gradient-to-b from-gray-800 to-transparent">
                                    </div>
                                    <Avatar.Root
                                        class="absolute left-2 top-10 ring-primary {user.isSpeaking
                                            ? 'ring'
                                            : 'ring-0'}">
                                        <Avatar.Image src="/api/avatars/{user.id}" alt={user.name} />
                                        <Avatar.Fallback>{user.name?.charAt(0)}{user.name?.charAt(1)}</Avatar.Fallback>
                                    </Avatar.Root>
                                </div>
                            </Popover.Content>
                        </Popover.Root>
                    {/each}
                {/if}
            </div>
        {/if}
    </ScrollArea>
</div>
