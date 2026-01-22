<script lang="ts">
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "$lib/components/ui/dialog";
    import { Button } from "$lib/components/ui/button";
    import { Badge } from "$lib/components/ui/badge";
    import { AlertCircle, Users } from "@lucide/svelte";
    import { t } from "$src/lib/translations";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import dayjs from "dayjs";

    interface PendingUser {
        id: string;
        username: string;
        email: string;
        createdAt: Date | string;
    }

    let { pendingUsers = [] }: { pendingUsers: PendingUser[] } = $props();

    let open = $derived(pendingUsers.length > 0 && !$page.url.pathname.startsWith("/admin"));

    const handleViewApprovals = async () => {
        await goto("/admin/user-approvals");
    };
</script>

<Dialog bind:open>
    <DialogContent class="sm:max-w-md">
        <DialogHeader>
            <div class="flex items-center gap-2">
                <div class="rounded-full bg-amber-100 dark:bg-amber-900/30 p-2">
                    <AlertCircle class="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <DialogTitle>{$t("pending_user_approvals_title")}</DialogTitle>
            </div>
            <DialogDescription class="pt-2">
                {$t("pending_user_approvals_message").replace("{count}", pendingUsers.length.toString())}
            </DialogDescription>
        </DialogHeader>

        <div class="max-h-60 overflow-y-auto">
            <div class="space-y-3">
                {#each pendingUsers as user (user.id)}
                    <div class="border border-border rounded-lg p-3 space-y-2">
                        <div class="flex items-start justify-between gap-2">
                            <div class="flex-1 min-w-0">
                                <p class="font-medium text-sm truncate">{user.username}</p>
                                <p class="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                            <Badge variant="outline" class="shrink-0">
                                <Users class="w-3 h-3 mr-1" />
                                Pending
                            </Badge>
                        </div>
                        <p class="text-xs text-muted-foreground">
                            {$t("joined")}: {dayjs(user.createdAt).format("DD/MM/YYYY HH:mm")}
                        </p>
                    </div>
                {/each}
            </div>
        </div>

        <Button onclick={handleViewApprovals} class="w-full">
            {$t("pending_user_approvals_view")}
        </Button>
    </DialogContent>
</Dialog>
