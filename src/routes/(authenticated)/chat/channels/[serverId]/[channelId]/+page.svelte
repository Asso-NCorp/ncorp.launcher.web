<script lang="ts">
	import ServerList from "$lib/components/chat/ServerList.svelte";
	import ChannelList from "$lib/components/chat/ChannelList.svelte";
	import ChatPane from "$lib/components/chat/ChatPane.svelte";
	import { onMount } from "svelte";
	import { chatController } from "$lib/controllers/ChatController.svelte";

	let { data } = $props();
	const serverId = data.serverId as string;
	const channelId = data.channelId as string;

	onMount(async () => {
		await chatController.init();
		chatController.selectServer(serverId);
		await chatController.selectChannelInternal(channelId);
	});

	const contextState = $derived(chatController.contextState);
	const currentTitle = $derived(chatController.currentTitle);
	const currentRoomId = $derived(contextState.selectedChannelId);
</script>

<!-- WRAPPER: empêche le scroll fenêtre et autorise les enfants à overflow -->
<div class="flex h-[calc(100vh-64px)] min-h-0 overflow-hidden bg-background">
	<!-- Colonne serveurs -->
	<div class="flex-none min-h-0 overflow-visible">
		<ServerList
			servers={contextState.servers}
			selectServer={(id) => chatController.selectServer(id)} />
	</div>

	<!-- Colonne salons -->
	<div class="flex-none min-h-0 overflow-auto">
		<ChannelList
			channels={contextState.channels}
			currentId={currentRoomId}
			onSelect={(id) => chatController.selectChannel(id)}
			title="Salons" />
	</div>

	<!-- Pane chat: prend l'espace, autorise overflow interne -->
	<div class="flex min-h-0 flex-1 overflow-hidden">
		<ChatPane title={currentTitle} roomId={currentRoomId} />
	</div>
</div>
