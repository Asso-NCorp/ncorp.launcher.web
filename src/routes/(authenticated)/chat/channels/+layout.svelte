<script lang="ts">
	import ServerList from "$lib/components/chat/ServerList.svelte";
	import ChannelList from "$lib/components/chat/ChannelList.svelte";
	import ScreenShareView from "$lib/components/chat/ScreenShareView.svelte";
	import VoiceFloatingWidget from "$lib/components/chat/VoiceFloatingWidget.svelte";
	import { Loader2 } from "@lucide/svelte";
	import { onMount } from "svelte";
	import { chatController } from "$lib/controllers/ChatController.svelte";

	let { children } = $props();
	let ready = $state(false);

	onMount(async () => {
		await chatController.init();
		ready = true;
	});

	const contextState = $derived(chatController.contextState);
	const currentRoomId = $derived(contextState.selectedChannelId);
	const sidebarTitle = $derived(chatController.isInDMContext ? "Messages directs" : "Salons");
</script>

{#if !ready}
	<!-- Loading state while chatStore loads rooms -->
	<div class="flex h-[calc(100vh-64px)] items-center justify-center bg-background">
		<Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
	</div>
{:else}
	<!-- WRAPPER: empêche le scroll fenêtre et autorise les enfants à overflow -->
	<div class="flex h-[calc(100vh-64px)] min-h-0 overflow-hidden bg-background">
		<!-- Colonnes gauches: serveurs + salons + widget voix -->
		<div class="flex h-full flex-none flex-col overflow-hidden">
			<div class="flex min-h-0 flex-1 overflow-hidden">
				<!-- Colonne serveurs -->
				<div class="flex-none min-h-0 overflow-visible">
					<ServerList
						servers={contextState.servers}
						selectServer={(id) => chatController.selectServer(id)} />
				</div>

				<!-- Colonne salons -->
				<div class="flex-none min-h-0 overflow-auto">
					<ChannelList
						channels={contextState.channels.toSorted((a, b) => {
							if (a.type === "voice" && b.type !== "voice") return 1;
							if (a.type !== "voice" && b.type === "voice") return -1;
							return a.name.localeCompare(b.name);
						})}
						currentId={currentRoomId}
						onSelect={(id) => chatController.selectChannel(id)}
						onJoinVoice={(id, name) => chatController.joinVoice(id, name)}
						title={sidebarTitle} />
				</div>
			</div>

			<!-- Widget voix -->
			<VoiceFloatingWidget />
		</div>

		<!-- Pane chat + screen share -->
		<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
			<ScreenShareView />
			<div class="flex min-h-0 flex-1 overflow-hidden">
				{@render children()}
			</div>
		</div>
	</div>
{/if}
