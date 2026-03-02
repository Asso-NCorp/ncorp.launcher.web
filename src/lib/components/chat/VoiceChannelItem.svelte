<script lang="ts">
	import { Volume2, Mic, MicOff, UserX, ArrowRightLeft, PhoneOff, Monitor } from "@lucide/svelte";
	import { cn } from "$lib/utils";
	import * as Avatar from "$lib/components/ui/avatar";
	import * as ContextMenu from "$lib/components/ui/context-menu";
	import { voiceSession } from "$lib/chat/chat.svelte";
	import type { VoiceParticipant } from "$lib/chat/livekit-session.svelte";
	import { liveUsers } from "$lib/states/live-users.svelte";
	import { global } from "$lib/states/global.svelte";
	import { chatController } from "$lib/controllers/ChatController.svelte";
	import { toast } from "svelte-sonner";

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

	/** Preview participants from polling (when not connected to this channel) */
	const previewParticipants = $derived(
		!isConnectedHere ? (voiceSession.channelParticipants.get(channelId) ?? []) : [],
	);

	const isAdmin = $derived((global.currentUser as any)?.role === "admin");

	/** Other voice channels available for the "Move to" submenu */
	const otherVoiceChannels = $derived(
		chatController.contextState.channels.filter(
			(c) => c.type === "voice" && c.id !== channelId,
		),
	);

	function getUserAvatar(identity: string): string | undefined {
		const user = liveUsers.getUser(identity);
		return (user as any)?.image ?? undefined;
	}

	function handleClick() {
		if (isConnectedHere) return;
		onJoin(channelId);
	}

	async function adminRemove(identity: string) {
		try {
			const res = await fetch("/api/livekit-admin", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "remove", room: channelId, identity }),
			});
			if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? res.statusText);
			toast.success("Participant déconnecté du salon");
		} catch (e: any) {
			toast.error(e?.message ?? "Erreur lors de la déconnexion");
		}
	}

	async function adminMove(identity: string, targetRoom: string) {
		try {
			const res = await fetch("/api/livekit-admin", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "move", room: channelId, identity, targetRoom }),
			});
			if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? res.statusText);
			toast.success("Participant déplacé");
		} catch (e: any) {
			toast.error(e?.message ?? "Erreur lors du déplacement");
		}
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
			{#snippet participantRow()}
				<div
					class={cn(
						"group flex items-center gap-2 rounded px-2 py-0.5 text-xs text-muted-foreground",
						p.isSpeaking && "text-emerald-400",
					)}>
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
						{#if p.isSpeaking}
							<span
								class="absolute -inset-0.5 rounded-full border-2 border-emerald-400 animate-pulse" />
						{/if}
					</div>
					<span class="truncate">{p.name}</span>
					{#if voiceSession.screenShareParticipantId === p.identity}
						<Monitor class="h-3 w-3 shrink-0 text-primary" title="Partage d'écran" />
					{/if}
					{#if p.isLocal}
						<!-- Local user hover controls -->
						<div class="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
							<button
								class={cn(
									"h-6 w-6 flex items-center justify-center rounded hover:bg-muted transition-colors",
									!p.audioEnabled && "text-red-400",
								)}
								onclick={(e) => { e.stopPropagation(); voiceSession.toggleMute(); }}
								title={p.audioEnabled ? "Couper le micro" : "Activer le micro"}>
								{#if p.audioEnabled}
									<Mic class="h-3.5 w-3.5" />
								{:else}
									<MicOff class="h-3.5 w-3.5" />
								{/if}
							</button>
							<button
								class="h-6 w-6 flex items-center justify-center rounded text-red-400 hover:bg-red-400/20 transition-colors"
								onclick={(e) => { e.stopPropagation(); voiceSession.disconnect(); }}
								title="Quitter le salon">
								<PhoneOff class="h-3.5 w-3.5" />
							</button>
						</div>
					{:else if !p.audioEnabled}
						<MicOff class="ml-auto h-3 w-3 shrink-0 text-red-400" />
					{/if}
				</div>
			{/snippet}

			{#if isAdmin && !p.isLocal}
				<ContextMenu.Root>
					<ContextMenu.Trigger class="w-full">
						{@render participantRow()}
					</ContextMenu.Trigger>
					<ContextMenu.Content class="w-48">
						<ContextMenu.Label class="text-xs">{p.name}</ContextMenu.Label>
						<ContextMenu.Separator />
						<ContextMenu.Item variant="destructive" onclick={() => adminRemove(p.identity)}>
							<UserX class="h-4 w-4" />
							Déconnecter
						</ContextMenu.Item>
						{#if otherVoiceChannels.length > 0}
							<ContextMenu.Sub>
								<ContextMenu.SubTrigger>
									<ArrowRightLeft class="h-4 w-4" />
									Déplacer vers...
								</ContextMenu.SubTrigger>
								<ContextMenu.SubContent>
									{#each otherVoiceChannels as ch (ch.id)}
										<ContextMenu.Item onclick={() => adminMove(p.identity, ch.id)}>
											<Volume2 class="h-4 w-4" />
											{ch.name}
										</ContextMenu.Item>
									{/each}
								</ContextMenu.SubContent>
							</ContextMenu.Sub>
						{/if}
					</ContextMenu.Content>
				</ContextMenu.Root>
			{:else}
				{@render participantRow()}
			{/if}
		{/each}
	</div>
{/if}

<!-- Preview participants (not connected yet) -->
{#if !isConnectedHere && previewParticipants.length > 0}
	<div class="ml-7 flex flex-col gap-0.5 pb-1">
		{#each previewParticipants as p (p.identity)}
			{#snippet previewRow()}
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
			{/snippet}

			{#if isAdmin}
				<ContextMenu.Root>
					<ContextMenu.Trigger class="w-full">
						{@render previewRow()}
					</ContextMenu.Trigger>
					<ContextMenu.Content class="w-48">
						<ContextMenu.Label class="text-xs">{p.name}</ContextMenu.Label>
						<ContextMenu.Separator />
						<ContextMenu.Item variant="destructive" onclick={() => adminRemove(p.identity)}>
							<UserX class="h-4 w-4" />
							Déconnecter
						</ContextMenu.Item>
						{#if otherVoiceChannels.length > 0}
							<ContextMenu.Sub>
								<ContextMenu.SubTrigger>
									<ArrowRightLeft class="h-4 w-4" />
									Déplacer vers...
								</ContextMenu.SubTrigger>
								<ContextMenu.SubContent>
									{#each otherVoiceChannels as ch (ch.id)}
										<ContextMenu.Item onclick={() => adminMove(p.identity, ch.id)}>
											<Volume2 class="h-4 w-4" />
											{ch.name}
										</ContextMenu.Item>
									{/each}
								</ContextMenu.SubContent>
							</ContextMenu.Sub>
						{/if}
					</ContextMenu.Content>
				</ContextMenu.Root>
			{:else}
				{@render previewRow()}
			{/if}
		{/each}
	</div>
{/if}
