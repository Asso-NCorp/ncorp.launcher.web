<script lang="ts">
	import ChatPane from "$lib/components/chat/ChatPane.svelte";
	import { untrack } from "svelte";
	import { chatController } from "$lib/controllers/ChatController.svelte";

	let { data } = $props();
	const serverId = $derived(data.serverId as string);
	const channelId = $derived(data.channelId as string);

	// Select server + channel when params change
	// untrack prevents re-triggering when controller internal state changes
	$effect(() => {
		const s = serverId;
		const c = channelId;
		untrack(() => {
			if (s && c) {
				chatController.selectServer(s, false);
				chatController.selectChannelInternal(c);
			}
		});
	});

	const currentTitle = $derived(chatController.currentTitle);
	const currentRoomId = $derived(chatController.contextState.selectedChannelId);
</script>

<ChatPane title={currentTitle} roomId={currentRoomId} />
