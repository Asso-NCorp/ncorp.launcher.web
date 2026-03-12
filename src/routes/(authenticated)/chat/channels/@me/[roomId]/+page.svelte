<script lang="ts">
	import ChatPane from "$lib/components/chat/ChatPane.svelte";
	import { untrack } from "svelte";
	import { chatController } from "$lib/controllers/ChatController.svelte";

	let { data } = $props();
	const roomId = $derived(data.roomId as string);

	// Select DM server + channel when params change
	// untrack prevents re-triggering when controller internal state changes
	$effect(() => {
		const r = roomId;
		untrack(() => {
			if (r) {
				chatController.selectServer("dm_server", false);
				chatController.selectChannelInternal(r);
			}
		});
	});

	const currentTitle = $derived(chatController.currentTitle);
	const currentRoomId = $derived(chatController.contextState.selectedChannelId);
</script>

<ChatPane title={currentTitle} roomId={currentRoomId} />
