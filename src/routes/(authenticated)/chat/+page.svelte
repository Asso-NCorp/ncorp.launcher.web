<script lang="ts">
	import ServerList from "$lib/components/chat/ServerList.svelte";
	import ChannelList from "$lib/components/chat/ChannelList.svelte";
	import ChatPane from "$lib/components/chat/ChatPane.svelte";
	import { onMount } from "svelte";
	import { chatStore } from "$src/lib/chat/chat.svelte";
	import type { ServerItemData, ChannelItemData } from "$src/lib/types";

	let servers = $state<ServerItemData[]>([]);
	let channels = $state<ChannelItemData[]>([]);

	onMount(async () => {
		await chatStore.init(() => localStorage.getItem("token") || "");

		const rooms = chatStore.rooms;
		const byGuild = new Map<string, { name: string; icon?: string | null }>();
		for (const r of rooms) {
			if (r.type === "GUILD_CHANNEL" && r.guildId) {
				if (!byGuild.has(r.guildId)) byGuild.set(r.guildId, { name: "Serveur", icon: null });
			}
		}
		servers = Array.from(byGuild.entries()).map(([id, g]) => ({
			id,
			name: g.name,
			icon: g.icon,
			active: false,
			unread: false
		}));

		const dmAndGroups = rooms.filter((r) => r.type !== "GUILD_CHANNEL");
		channels = dmAndGroups.map((r) => ({
			id: r.id ?? "",
			type: r.type === "DM" ? "direct" : "group",
			name: r.name ?? (r.type === "DM" ? "Message direct" : "Groupe")
		}));
	});

	const currentRoomId = $derived(chatStore.currentRoomId);
	const title = $derived(
		chatStore.rooms.find((r) => r.id === currentRoomId)?.name ?? (currentRoomId ? "Salon" : "")
	);

	function selectServer(guildId: string) {
		const list = chatStore.rooms.filter((r) => r.type === "GUILD_CHANNEL" && r.guildId === guildId);
		channels = list.map((r) => ({
			id: r.id ?? "",
			type: r.type === "DM" ? "direct" : "group",
			name: r.name ?? "channel"
		}));
	}
	async function selectChannel(roomId: string) {
		await chatStore.selectRoom(roomId);
	}
</script>

<!-- WRAPPER: empêche le scroll fenêtre et autorise les enfants à overflow -->
<div class="flex h-[calc(100vh-64px)] min-h-0 overflow-hidden bg-background">
	<!-- Colonne serveurs -->
	<div class="flex-none min-h-0 overflow-auto">
		<ServerList {servers} {selectServer} />
	</div>

	<!-- Colonne salons -->
	<div class="flex-none min-h-0 overflow-auto">
		<ChannelList {channels} currentId={currentRoomId} onSelect={selectChannel} title="Salons" />
	</div>

	<!-- Pane chat: prend l'espace, autorise overflow interne -->
	<div class="flex min-h-0 flex-1 overflow-hidden">
		<ChatPane {title} roomId={currentRoomId} />
	</div>
</div>
