<script lang="ts">
    import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Clock, AlertCircle, RefreshCw } from "@lucide/svelte";
    import { t } from "$src/lib/translations";
    import { authClient } from "$src/lib/auth/client";
    import { invalidate } from "$app/navigation";

    let { data } = $props();
    let isRefreshing = $state(false);

    const handleSignOut = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    window.location.href = "/signin";
                },
            },
        });
    };

    const handleRefresh = async () => {
        isRefreshing = true;
        try {
            // Invalidate all data to force server reload
            await invalidate("*");
        } finally {
            isRefreshing = false;
        }
    };
</script>

<div class="min-h-screen flex items-center justify-center p-4">
    <Card class="w-full max-w-md">
        <CardHeader class="text-center pb-3">
            <div class="flex justify-center mb-4">
                <div class="rounded-full bg-blue-100 dark:bg-blue-900/30 p-3">
                    <Clock class="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
            </div>
            <CardTitle class="text-2xl">{$t("account_pending_approval")}</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
            <!-- Status Message -->
            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4 space-y-2">
                <div class="flex gap-2">
                    <AlertCircle class="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div class="space-y-1">
                        <p class="font-medium text-blue-900 dark:text-blue-100 text-sm">
                            {$t("account_created_successfully")}
                        </p>
                        <p class="text-blue-800 dark:text-blue-200 text-sm">
                            {$t("admin_approval_needed")}
                        </p>
                    </div>
                </div>
            </div>

            <!-- User Info -->
            <div class="space-y-3 bg-muted/50 rounded-lg p-4">
                <div>
                    <p class="text-xs text-muted-foreground font-medium">{$t("email")}</p>
                    <p class="text-sm font-medium">{data.email}</p>
                </div>
                {#if data.username}
                    <div>
                        <p class="text-xs text-muted-foreground font-medium">{$t("username")}</p>
                        <p class="text-sm font-medium">{data.username}</p>
                    </div>
                {/if}
            </div>

            <!-- Info Message -->
            <p class="text-xs text-muted-foreground text-center">
                {$t("email_notification_on_approval")}
            </p>

            <!-- Status Badge -->
            <div class="text-center">
                <span class="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-medium">
                    {$t("pending_review")}
                </span>
            </div>

            <!-- Buttons -->
            <div class="flex gap-3 pt-2">
                <Button 
                    variant="outline" 
                    class="flex-1 gap-2" 
                    onclick={handleRefresh}
                    disabled={isRefreshing}
                >
                    <div class:animate-spin={isRefreshing}>
                        <RefreshCw class="w-4 h-4" />
                    </div>
                    {isRefreshing ? "Refreshing..." : "Refresh"}
                </Button>
                <Button 
                    variant="outline" 
                    class="flex-1" 
                    onclick={handleSignOut}
                >
                    {$t("sign_out")}
                </Button>
            </div>
        </CardContent>
    </Card>
</div>
