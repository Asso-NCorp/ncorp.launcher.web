<script lang="ts">
	import { X } from "@lucide/svelte";
	import { Button } from "$lib/components/ui/button";
	import { voiceSession } from "$lib/chat/chat.svelte";
	import { liveUsers } from "$lib/states/live-users.svelte";

	/**
	 * Renders the remote screen share video.
	 * Place this anywhere in the layout — it will only show when someone is screen sharing.
	 */

	let videoEl: HTMLVideoElement | undefined = $state();

	/** Once the <video> node is in the DOM, register it with the session */
	function bindVideo(node: HTMLVideoElement) {
		const cleanup = voiceSession.attachScreenShareVideo(node);
		return {
			destroy() {
				cleanup.destroy();
			},
		};
	}

	const sharerName = $derived(() => {
		const id = voiceSession.screenShareParticipantId;
		if (!id) return null;
		const user = liveUsers.getUser(id);
		return (user as any)?.name ?? id;
	});

	const isRemoteShare = $derived(
		voiceSession.screenShareParticipantId !== null &&
			voiceSession.screenShareParticipantId !== voiceSession.identity,
	);
</script>

{#if voiceSession.connected && voiceSession.screenShareParticipantId}
	<div class="relative flex flex-col overflow-hidden rounded-lg border bg-black">
		<!-- Header -->
		<div
			class="flex items-center justify-between bg-background/80 px-3 py-1.5 text-xs backdrop-blur">
			<span class="font-medium text-muted-foreground">
				{#if isRemoteShare}
					{sharerName()} partage son écran
				{:else}
					Vous partagez votre écran
				{/if}
			</span>
			{#if !isRemoteShare}
				<Button
					variant="destructive"
					size="sm"
					class="h-6 gap-1 px-2 text-xs"
					onclick={() => voiceSession.toggleScreenShare()}>
					<X class="h-3 w-3" />
					Arrêter
				</Button>
			{/if}
		</div>

		<!-- Video -->
		<!-- svelte-ignore a11y_media_has_caption -->
		<video
			use:bindVideo
			autoplay
			playsinline
			class="aspect-video w-full bg-black object-contain"
			muted={!isRemoteShare}>
		</video>
	</div>
{/if}
