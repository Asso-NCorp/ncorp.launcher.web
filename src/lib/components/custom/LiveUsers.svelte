<script lang="ts">
    import { liveUsers } from "$src/lib/states/live-users.svelte";
    import { cn } from "$src/lib/utils";
    import Loader from "./Loader.svelte";
    import ScrollArea from "$src/lib/components/custom/ScrollArea.svelte";
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

    let connectedAdmins = $derived(adminUsers.filter((user) => user.status === "Connected"));

    let connectedUsers = $derived(otherUsers.filter((user) => user.status === "Connected"));
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
					<h2>{$t("admins")} — ({connectedAdmins.length}/{adminUsers.length})</h2>
					{#each adminUsers as user}<LiveUserRow {user} />{/each}
				{/if}

				{#if adminUsers.length > 0 && otherUsers.length > 0}
					<hr class="my-2 border-border" />
				{/if}

				{#if otherUsers.length > 0}
					<h2>{$t("users")} — ({connectedUsers.length}/{otherUsers.length})</h2>
					{#each otherUsers as user}<LiveUserRow {user} />{/each}
				{/if}
			</div>
		{/if}
	</ScrollArea>
</div>


<style>
    h2 {
        @apply user-list-header;
    }
</style>
