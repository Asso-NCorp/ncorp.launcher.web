<script lang="ts">
    import { liveUsers } from "$src/lib/states/live-users.svelte";
    import { cn } from "$src/lib/utils";
    import Loader from "./Loader.svelte";
    import ScrollArea from "$src/lib/components/custom/ScrollArea.svelte";
    import { t } from "$src/lib/translations";
    import LiveUserRow from "./LiveUserRow.svelte";
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

    let connectedAdmins = $derived(adminUsers.filter((user) => user.status === "Connected"));
    let connectedUsers = $derived(otherUsers.filter((user) => user.status === "Connected"));
    let disconnectedUsers = $derived(otherUsers.filter((user) => user.status === "Disconnected"));

</script>

<div class="flex h-screen min-h-0 flex-col">
	<!-- Pas besoin d'enveloppe; on donne la hauteur via flex -->
	<ScrollArea
		minThumb={20}
		thickness={3}>
		{#if liveUsers.loading}
			<div class="flex h-full w-full items-center justify-center"><Loader size={30} /></div>
		{:else if liveUsers.users.length === 0}
			<div class="flex h-full w-full items-center justify-center">
				<span class="text-lg text-secondary">{$t("no_users")}</span>
			</div>
		{:else}
			<div class="my-2 flex w-full flex-col gap-2 pr-2.5" id="users-container">
				{#if adminUsers.length > 0}
					<h2 class="pb-1 pl-4 pr-1 pt-5 text-sm font-semibold text-muted-foreground">{$t("admins")} — ({connectedAdmins.length}/{adminUsers.length})</h2>
					{#each adminUsers as user}<LiveUserRow {user} />{/each}
				{/if}

				{#if adminUsers.length > 0 && otherUsers.length > 0}
					<hr class="border-border" />
				{/if}

				{#if connectedUsers.length > 0}
					<h2 class="pb-1 pl-4 pr-1 pt-1 text-sm font-semibold text-muted-foreground">{$t("online")} — ({connectedUsers.length})</h2>
					{#each connectedUsers as user}<LiveUserRow {user} />{/each}
				{/if}

				{#if disconnectedUsers.length > 0}
					<h2 class="pb-1 pl-4 pr-1 pt-1 text-sm font-semibold text-muted-foreground">{$t("offline")} — ({disconnectedUsers.length})</h2>
					{#each disconnectedUsers as user}<LiveUserRow {user} />{/each}
				{/if}
			</div>
		{/if}
	</ScrollArea>
</div>