<script lang="ts">
    import { liveUsers } from "$src/lib/states/live-users.svelte";
    import Loader from "./Loader.svelte";
    import { t } from "$src/lib/translations";
    import LiveUserRow from "./LiveUserRow.svelte";
    import type { LiveUser } from "$src/lib/shared-models";
    import ScrollArea from "$src/lib/components/ui/scroll-area/scroll-area.svelte";

	
    let { class: klazz }: { class?: string } = $props();

	// Admin users (all, connected or not)
	let adminUsers: LiveUser[] = $derived(
		liveUsers.users
			.filter((user) => user.role === "admin")
			.sort((a, b) => (a.name || "").localeCompare(b.name || "")),
	);

	// Distinct non-admin / non-user role names sorted asc
	let middleRoleNames = $derived(
		Array.from(
			new Set(
				liveUsers.users
					.map((u) => u.role)
					.filter(
						(r): r is string =>
							!!r &&
							r !== "admin" &&
							r !== "user" &&
							r !== "beta_tester" // <- treat beta testers like normal users
					)
			)
		).sort((a, b) => a.localeCompare(b))
	);

	// Groups for middle roles (include disconnected)
	let roleGroups = $derived(
		middleRoleNames.map((roleName) => {
			const users = liveUsers.users
				.filter((u) => u.role === roleName)
				.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
			const connectedCount = users.filter((u) => u.status !== "Disconnected").length;
			return { roleName, users, connectedCount };
		})
	);

	// Base "user" role (or missing/unknown treated as user)
	let baseUsers = $derived(
		liveUsers.users
			.filter(
				(u) => !u.role || u.role === "user" || u.role === "beta_tester" // <- include beta testers
			)
			.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
	);
	let onlineUsers = $derived(baseUsers.filter((u) => u.status !== "Disconnected"));
	let offlineUsers = $derived(baseUsers.filter((u) => u.status === "Disconnected"));
</script>

<div class="flex h-screen min-h-0 flex-col">
	<!-- Pas besoin d'enveloppe; on donne la hauteur via flex -->
	<ScrollArea class={klazz}>
		{#if liveUsers.loading}
			<div class="flex h-full w-full items-center justify-center"><Loader size={30} /></div>
		{:else if liveUsers.users.length === 0}
			<div class="flex h-full w-full items-center justify-center">
				<span class="text-lg text-secondary">{$t("no_users")}</span>
			</div>
		{:else}
			<div class="my-2 flex w-full flex-col gap-2 pr-2.5" id="users-container">
				{#if adminUsers.length > 0}
					<h2 class="pb-1 pl-4 pr-1 pt-5 text-sm font-semibold text-muted-foreground">
						{$t("admins")} — ({adminUsers.filter(u=>u.status!=="Disconnected").length}/{adminUsers.length})
					</h2>
					{#each adminUsers as user}<LiveUserRow {user} />{/each}
				{/if}

				{#if adminUsers.length > 0 && roleGroups.length > 0}
					<!-- Show separator after admins only if there are role-specific groups (avoid double hr) -->
					<hr class="border-border" />
				{/if}

				{#each roleGroups as group, i}
					<h2 class="pb-1 pl-4 pr-1 pt-1 text-sm font-semibold text-muted-foreground">
						{$t(group.roleName)}s — ({group.connectedCount}/{group.users.length})
					</h2>
					{#each group.users as user}<LiveUserRow {user} />{/each}
					{#if i < roleGroups.length - 1}
						<hr class="border-border" />
					{/if}
				{/each}

				{#if (adminUsers.length > 0 || roleGroups.length > 0) && (onlineUsers.length > 0 || offlineUsers.length > 0)}
					<hr class="border-border" />
				{/if}

				{#if onlineUsers.length > 0}
					<h2 class="pb-1 pl-4 pr-1 pt-1 text-sm font-semibold text-muted-foreground">
						{$t("online")} — ({onlineUsers.length})
					</h2>
					{#each onlineUsers as user}<LiveUserRow {user} />{/each}
				{/if}

				{#if offlineUsers.length > 0}
					<h2 class="pb-1 pl-4 pr-1 pt-1 text-sm font-semibold text-muted-foreground">
						{$t("offline")} — ({offlineUsers.length})
					</h2>
					{#each offlineUsers as user}<LiveUserRow {user} />{/each}
				{/if}
			</div>
		{/if}
	</ScrollArea>
</div>