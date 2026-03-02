<script lang="ts">
	import { Volume2, Mic, MicOff } from "@lucide/svelte";
	import { cn } from "$lib/utils";
	import * as Avatar from "$lib/components/ui/avatar";
	import { voiceSession } from "$lib/chat/chat.svelte";
	import type { VoiceParticipant } from "$lib/chat/livekit-session.svelte";
	import { liveUsers } from "$lib/states/live-users.svelte";

	const {
		channelId,
		channelName,
		selected = false,
		onJoin,
	} = $props<{
		channelId: string;
		channelName: string;
		selected?: boolean;
		onJoin: (channelId: string) => void;
	}>();

	/** Is the voice session connected to THIS channel? */
	const isConnectedHere = $derived(
		voiceSession.connected && voiceSession.roomName === channelId,
	);

	/** Participants in this channel (only if we're connected to it) */
	const participants: VoiceParticipant[] = $derived(
		isConnectedHere ? voiceSession.participants : [],
	);

	/** Preview participants (when not connected) */
	const previewParticipants = $derived(
		!isConnectedHere ? voiceSession.previewParticipants.filter(() => voiceSession.roomName === channelId) : [],
	);

	function getUserAvatar(identity: string): string | undefined {
		const user = liveUsers.getUser(identity);
		return (user as any)?.image ?? undefined;
	}

	function handleClick() {
		onJoin(channelId);
	}
</script>

<!-- Voice channel button -->
<button
	class={cn(
		"flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-muted/70",
		selected && "bg-muted font-semibold",
		isConnectedHere && "text-emerald-400",
	)}
	onclick={handleClick}
	aria-current={selected ? "true" : "false"}>
	<Volume2 class="h-4 w-4 shrink-0 opacity-60" />
	<span class="truncate">{channelName}</span>
</button>

<!-- Connected participants list -->
{#if participants.length > 0}
	<div class="ml-7 flex flex-col gap-0.5 pb-1">
		{#each participants as p (p.identity)}
			<div
				class={cn(
					"flex items-center gap-2 rounded px-2 py-0.5 text-xs text-muted-foreground",
					p.isSpeaking && "text-emerald-400",
				)}>
				<!-- Avatar -->
				<div class="relative">
					<Avatar.Root class="h-5 w-5">
						{#if getUserAvatar(p.identity)}
							<Avatar.Image
								src={getUserAvatar(p.identity)}
								alt={p.name}
								class="h-5 w-5 rounded-full object-cover" />
						{:else}
							<Avatar.Fallback class="h-5 w-5 text-[9px]">
								{p.name?.slice(0, 2).toUpperCase() ?? "??"}
							</Avatar.Fallback>
						{/if}
					</Avatar.Root>
					<!-- Speaking ring -->
					{#if p.isSpeaking}
						<span
							class="absolute -inset-0.5 rounded-full border-2 border-emerald-400 animate-pulse" />
					{/if}
				</div>

				<span class="truncate">{p.name}</span>

				<!-- Mic state -->
				{#if !p.audioEnabled}
					<MicOff class="ml-auto h-3 w-3 shrink-0 text-red-400" />
				{/if}
			</div>
		{/each}
	</div>
{/if}

<!-- Preview participants (not connected yet) -->
{#if !isConnectedHere && previewParticipants.length > 0}
	<div class="ml-7 flex flex-col gap-0.5 pb-1">
		{#each previewParticipants as p (p.identity)}
			<div class="flex items-center gap-2 rounded px-2 py-0.5 text-xs text-muted-foreground/60">
				<Avatar.Root class="h-5 w-5">
					{#if getUserAvatar(p.identity)}
						<Avatar.Image
							src={getUserAvatar(p.identity)}
							alt={p.name}
							class="h-5 w-5 rounded-full object-cover" />
					{:else}
						<Avatar.Fallback class="h-5 w-5 text-[9px]">
							{p.name?.slice(0, 2).toUpperCase() ?? "??"}
						</Avatar.Fallback>
					{/if}
				</Avatar.Root>
				<span class="truncate">{p.name}</span>
			</div>
		{/each}
	</div>
{/if}
