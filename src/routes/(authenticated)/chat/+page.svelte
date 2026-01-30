<script lang="ts">
	import { chatStore } from "$lib/chat/chat.svelte";
	import { onMount, onDestroy } from "svelte";
	import { chatController } from "$lib/controllers/ChatController.svelte";
	import { goto } from "$app/navigation";

	onMount(async () => {
		await chatController.init();
		chatController.rebuildServerList();

		// Restore last selection or default to first server
		try {
			const lastServerId = localStorage.getItem("chat:lastServerId");
			const lastChannelId = localStorage.getItem("chat:lastChannelId");

			if (lastServerId && lastChannelId) {
				if (lastServerId === "dm_server") {
					await goto(`/chat/channels/@me/${lastChannelId}`);
				} else {
					await goto(`/chat/channels/${lastServerId}/${lastChannelId}`);
				}
			} else if (chatController.contextState.servers.length > 0) {
				const firstServer = chatController.contextState.servers[0];
				const firstChannel = chatStore.rooms.find((r) =>
					firstServer.id === "dm_server" ? r.type !== "GUILD_CHANNEL" : r.guildId === firstServer.id
				);
				if (firstChannel?.id) {
					if (firstServer.id === "dm_server") {
						await goto(`/chat/channels/@me/${firstChannel.id}`);
					} else {
						await goto(`/chat/channels/${firstServer.id}/${firstChannel.id}`);
					}
				}
			}
		} catch {}
	});

	onDestroy(() => {
		// Clear current room when leaving the chat page so notifications show when on other pages
		chatStore.currentRoomId = null;
	});
</script>
