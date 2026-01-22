<script lang="ts">
    import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Badge } from "$lib/components/ui/badge";
    import { AlertCircle, CheckCircle2, XCircle, Users } from "@lucide/svelte";
    import { toast } from "svelte-sonner";
    import { t } from "$src/lib/translations";
    import BlurFade from "$lib/components/custom/BlurFade.svelte";
    import AvatarWithStatus from "$src/lib/components/custom/AvatarWithStatus.svelte";
    import type { PageData } from "./$types";
    import type { role } from "@prisma/client";

    interface User {
        id: string;
        email: string;
        username: string | null;
        name: string;
        createdAt: Date;
        image: string | null;
        role: string | null;
        referralSource: string | null;
    }

    let { data }: { data: PageData } = $props();

    let loading: Record<string, boolean> = {};
    let pendingUsers: User[] = $state(data.pendingUsers);
    let rejectedUsers: User[] = $state(data.rejectedUsers);
    let roles: role[] = $state(data.roles || []);

    // Helper to get avatar decoration
    const getAvatarDecoration = (userRole: string | null): string | undefined => {
        if (!userRole) return undefined;
        const roleData = roles.find((r) => r.name === userRole);
        return roleData?.avatar_decoration_static ?? roleData?.avatar_decoration_animated ?? undefined;
    };

    const handleApproval = async (userId: string, action: "approve" | "reject") => {
        loading[userId] = true;

        try {
            const response = await fetch("/api/admin/user-approval", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ userId, action }),
            });

            if (!response.ok) {
                const error = await response.json();
                toast.error(error.error || `Failed to ${action} user`);
                return;
            }

            const result = await response.json();

            if (action === "approve") {
                pendingUsers = pendingUsers.filter((u: User) => u.id !== userId);
                toast.success($t("user_approved_successfully"));
            } else {
                const user = pendingUsers.find((u: User) => u.id === userId);
                if (user) {
                    pendingUsers = pendingUsers.filter((u: User) => u.id !== userId);
                    rejectedUsers = [user, ...rejectedUsers];
                }
                toast.success($t("user_rejected"));
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error(`An error occurred while ${action}ing the user`);
        } finally {
            loading[userId] = false;
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };
</script>

<div class="max-w-5xl mx-auto py-6">
    <!-- Header -->
    <BlurFade>
        <div class="mb-8">
            <div class="flex items-center gap-3 mb-2">
                <Users class="w-8 h-8 text-primary" />
                <h1 class="text-3xl font-bold">{$t("user_approvals")}</h1>
            </div>
            <p class="text-muted-foreground">{$t("manage_account_approvals")}</p>
        </div>
    </BlurFade>

    <!-- Pending Approvals Section -->
    <BlurFade delay={0.1}>
        <Card class="mb-8">
            <CardHeader class="border-b">
                <div class="flex items-center justify-between">
                    <CardTitle class="flex items-center gap-2">
                        <AlertCircle class="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
                        Approvations en attente
                        <Badge variant="secondary">{pendingUsers.length}</Badge>
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent class="p-0">
                {#if pendingUsers.length === 0}
                    <div class="p-8 text-center text-muted-foreground">
                        <CheckCircle2 class="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>{$t("no_pending_approvals")}</p>
                    </div>
                {:else}
                    <div class="divide-y">
                        {#each pendingUsers as user (user.id)}
                            <div class="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                <div class="flex items-center gap-3 flex-1 min-w-0">
                                    <AvatarWithStatus
                                        user={{
                                            ...user,
                                            status: "Disconnected" as const,
                                            isSpeaking: false,
                                            activity: undefined,
                                            gameInstallProgress: 0,
                                        } as any}
                                        decorationSrc={getAvatarDecoration(user.role)}
                                        showStatusDot={false}
                                        size={40}
                                    />

                                    <div class="min-w-0 flex-1">
                                        <p class="font-medium truncate">{user.name || user.username || "No name"}</p>
                                        <p class="text-sm text-muted-foreground truncate">{user.email}</p>
                                        <p class="text-xs text-muted-foreground mt-1">
                                            {$t("joined")} {formatDate(user.createdAt)}
                                        </p>
                                        {#if user.referralSource}
                                            <p class="text-xs text-primary/70 mt-1">
                                                {$t("heard_from")}: <span class="font-medium">{user.referralSource}</span>
                                            </p>
                                        {/if}
                                    </div>
                                </div>

                                <div class="flex gap-2 ml-4 shrink-0">
                                    <Button
                                        size="sm"
                                        variant="default"
                                        onclick={() => handleApproval(user.id, "approve")}
                                        disabled={loading[user.id]}
                                        class="bg-green-600 hover:bg-green-700"
                                    >
                                        {#if loading[user.id]}
                                            <span class="inline-block animate-spin mr-2">⏳</span>
                                        {/if}
                                        {$t("approve")}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onclick={() => handleApproval(user.id, "reject")}
                                        disabled={loading[user.id]}
                                    >
                                        {#if loading[user.id]}
                                            <span class="inline-block animate-spin mr-2">⏳</span>
                                        {/if}
                                        {$t("reject")}
                                    </Button>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            </CardContent>
        </Card>
    </BlurFade>

    <!-- Rejected Users Section -->
    {#if rejectedUsers.length > 0}
        <BlurFade delay={0.2}>
            <Card>
                <CardHeader class="border-b">
                    <CardTitle class="flex items-center gap-2">
                        <XCircle class="w-5 h-5 text-red-600 dark:text-red-500" />
                        {$t("rejected_users")}
                        <Badge variant="secondary">{rejectedUsers.length}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent class="p-0">
                    <div class="divide-y">
                        {#each rejectedUsers as user (user.id)}
                            <div class="p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors">
                                <AvatarWithStatus
                                    user={{
                                        ...user,
                                        status: "Disconnected" as const,
                                        isSpeaking: false,
                                        activity: undefined,
                                        gameInstallProgress: 0,
                                    } as any}
                                    decorationSrc={getAvatarDecoration(user.role)}
                                    showStatusDot={false}
                                    size={40}
                                />

                                <div class="flex-1 min-w-0">
                                    <p class="font-medium truncate">{user.name || user.username || "No name"}</p>
                                    <p class="text-sm text-muted-foreground truncate">{user.email}</p>
                                    {#if user.referralSource}
                                        <p class="text-xs text-primary/70 mt-1">
                                            {$t("heard_from")}: <span class="font-medium">{user.referralSource}</span>
                                        </p>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>
                </CardContent>
            </Card>
        </BlurFade>
    {/if}
</div>

