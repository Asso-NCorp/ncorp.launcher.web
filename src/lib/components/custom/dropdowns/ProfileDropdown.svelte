<script lang="ts">
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import { Settings, LogOut, ComputerIcon, UserCircle } from "@lucide/svelte";
    import { buttonVariants } from "../../ui/button";
    import { authClient, type User } from "$src/lib/auth/client";
    import SideMenuItem from "../SideMenuItem.svelte";
    import * as Avatar from "../../ui/avatar";
    import { goto } from "$app/navigation";
    import { t } from "$src/lib/translations";
    import { global } from "$src/lib/states/global.svelte";
    import UserStatusDot from "../UserStatusDot.svelte";
    import { liveAgentConnection } from "$src/lib/states/live-agent.svelte";
    import { liveServerConnection } from "$src/lib/states/live-server.svelte";
    import type { LiveUser } from "$src/lib/shared-models";
    import AdminStatusDot from "../AdminStatusDot.svelte";
    import { getLocalApi } from "$src/lib/utils";
    import { PUBLIC_AGENT_URL } from "$env/static/public";

    let { user }: { user: LiveUser } = $props();
    let name = user.name;

    const handleDisconnect = async () => {
        try {
            await authClient.signOut();
            cookieStore.delete("token");
            
            if (liveAgentConnection?.connection) {
                liveAgentConnection.connection.stop();
            }

            if (liveServerConnection?.connection) {
                liveServerConnection.connection.stop();
            }

            cookieStore.delete("token");
            await fetch(`${PUBLIC_AGENT_URL}/Logout`, { method: "POST", credentials: "include" });
            
        } catch (error) {
            console.error("Error during sign out:", error);
        }finally {
            goto("/signin");
        }
    };
</script>

<DropdownMenu.Root>
    <DropdownMenu.Trigger class="{buttonVariants({ variant: 'ghost' })} w-full">
        <SideMenuItem href="/" class="w-full py-0 pb-0 text-base" collapsed={global.sidebarCollapsed}>
            <div class="relative">
                <Avatar.Root class="size-8 ring-primary">
                    <Avatar.Image src="/api/avatars/{user.id}" alt={user.name} class="object-cover object-center" />
                    <Avatar.Fallback class="text-muted-foreground">
                        {user.name?.charAt(0)}{user.name?.charAt(1)}
                    </Avatar.Fallback>
                </Avatar.Root>

                <!-- Status dot -->
                <AdminStatusDot user={user} />
            </div>

            {#if !global.sidebarCollapsed}
                <span>{name}</span>
            {/if}
        </SideMenuItem>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content class="z-[110] w-56">
        <DropdownMenu.Group>
            <DropdownMenu.GroupHeading>Mon compte</DropdownMenu.GroupHeading>
            <DropdownMenu.Group>
                <DropdownMenu.Item onclick={() => goto("/my/settings")}>
                    <Settings class="mr-2 size-4" />
                    <span>{$t("settings")}</span>
                </DropdownMenu.Item>

                <DropdownMenu.Item onclick={() => goto("/my/profile")}>
                    <UserCircle class="mr-2 size-4" />
                    <span>{$t("my_profile")}</span>
                </DropdownMenu.Item>
            </DropdownMenu.Group>
        </DropdownMenu.Group>

        <DropdownMenu.Separator />

        <DropdownMenu.Group>
            <DropdownMenu.GroupHeading>Système</DropdownMenu.GroupHeading>
            <DropdownMenu.Group>
                <DropdownMenu.Item onclick={() => goto("/my/pc")}>
                    <ComputerIcon class="mr-2 size-4" />
                    <span>{$t("my_computer")}</span>
                </DropdownMenu.Item>
            </DropdownMenu.Group>
            <DropdownMenu.Item
                class="text-danger hover:!bg-danger/20 hover:!text-danger"
                onclick={handleDisconnect}>
                <LogOut class="mr-2 size-4" />
                <span>{$t("logout")}</span>
            </DropdownMenu.Item>
        </DropdownMenu.Group>
    </DropdownMenu.Content>
</DropdownMenu.Root>
