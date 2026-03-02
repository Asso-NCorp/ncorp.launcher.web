<script lang="ts">
	import { Signal, Mic, MicOff, PhoneOff, Volume2, Headphones, UserX, ArrowRightLeft } from "@lucide/svelte";
	import { Button } from "$lib/components/ui/button";
	import * as Popover from "$lib/components/ui/popover";
	import * as Tooltip from "$lib/components/ui/tooltip";
	import * as Avatar from "$lib/components/ui/avatar";
	import * as ContextMenu from "$lib/components/ui/context-menu";
	import { cn } from "$lib/utils";
	import { chatStore, voiceSession } from "$lib/chat/chat.svelte";
	import { global } from "$lib/states/global.svelte";
	import { chatController } from "$lib/controllers/ChatController.svelte";
	import { toast } from "svelte-sonner";
	import { fade } from "svelte/transition";

	// --- Connected state ---
	const participantCount = $derived(voiceSession.participants.length);
	const displayName = $derived(voiceSession.roomDisplayName || voiceSession.roomName);
	const speakingNames = $derived(
		voiceSession.participants
			.filter((p) => p.isSpeaking && !p.isLocal)
			.map((p) => p.name)
			.slice(0, 3),
	);

	// --- Preview state (not connected but others are in channels) ---
	const activeChannels = $derived.by(() => {
		const entries: { roomName: string; participants: { identity: string; name: string }[] }[] = [];
		for (const [roomName, participants] of voiceSession.channelParticipants) {
			if (participants.length > 0) {
				entries.push({ roomName, participants });
			}
		}
		return entries;
	});
	const totalActiveUsers = $derived(
		activeChannels.reduce((sum, ch) => sum + ch.participants.length, 0),
	);

	/** Show widget if connected OR if there are people in voice channels */
	const isVisible = $derived(voiceSession.connected || totalActiveUsers > 0);

	async function handleToggleMute() {
		await voiceSession.toggleMute();
	}

	async function handleDisconnect() {
		await voiceSession.disconnect();
	}

	const isAdmin = $derived((global.currentUser as any)?.role === "admin");

	const otherVoiceChannels = $derived(
		chatController.contextState.channels.filter(
			(c) => c.type === "voice" && c.id !== voiceSession.roomName,
		),
	);

	async function adminRemove(identity: string) {
		try {
			const res = await fetch("/api/livekit-admin", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "remove", room: voiceSession.roomName, identity }),
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
				body: JSON.stringify({ action: "move", room: voiceSession.roomName, identity, targetRoom }),
			});
			if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? res.statusText);
			toast.success("Participant déplacé");
		} catch (e: any) {
			toast.error(e?.message ?? "Erreur lors du déplacement");
		}
	}

	const avatarSource = $derived.by(() => {
		const raw = voiceSession.connected
			? voiceSession.participants.map((p) => ({ identity: p.identity, name: p.name, speaking: p.isSpeaking }))
			: activeChannels.flatMap((ch) => ch.participants.map((p) => ({ ...p, speaking: false })));
		const seen = new Set<string>();
		return raw.filter((p) => {
			if (seen.has(p.identity)) return false;
			seen.add(p.identity);
			return true;
		});
	});
</script>

{#if isVisible}
	<div class="flex h-full items-center border-l" transition:fade={{ duration: 150 }}>
		<Popover.Root>
			<Popover.Trigger>
				<button
					class="group flex h-full items-center gap-2 px-3 transition-colors hover:bg-accent">
					{#if voiceSession.connected}
						<!-- Connected: pulsing green dot -->
						<span class="relative flex h-2.5 w-2.5">
							<span
								class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
							></span>
							<span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
						</span>
						<div class="flex flex-col items-start">
							<span class="max-w-[100px] truncate text-xs font-medium">{displayName}</span>
							{#if speakingNames.length > 0}
								<span class="max-w-[100px] animate-pulse truncate text-[10px] text-emerald-400">
									{speakingNames.join(", ")}
								</span>
							{:else}
								<span class="text-[10px] text-muted-foreground">
									{participantCount}
									{participantCount === 1 ? "personne" : "personnes"}
								</span>
							{/if}
						</div>
					{:else}
						<!-- Not connected: headphones icon with count -->
						<Headphones class="h-4 w-4 text-muted-foreground" />
						<div class="flex flex-col items-start">
							<span class="text-xs font-medium text-muted-foreground">
								{totalActiveUsers} en vocal
							</span>
						</div>
					{/if}

					<!-- Quick avatars (show from connected participants or all active users) -->
					{#if avatarSource.length > 0}
						<div class="flex -space-x-1.5">
							{#each avatarSource.slice(0, 3) as p (p.identity)}
								<Avatar.Root
									class={cn(
										"h-5 w-5 border transition-all",
										p.speaking
											? "border-emerald-400 ring-1 ring-emerald-400/50"
											: "border-background",
									)}>
									<Avatar.Fallback class="text-[8px]">
										{p.name?.slice(0, 2).toUpperCase() ?? "??"}
									</Avatar.Fallback>
								</Avatar.Root>
							{/each}
							{#if avatarSource.length > 3}
								<span
									class="flex h-5 w-5 items-center justify-center rounded-full border border-background bg-muted text-[8px]">
									+{avatarSource.length - 3}
								</span>
							{/if}
						</div>
					{/if}
				</button>
			</Popover.Trigger>

			<Popover.Content class="w-72 p-0" align="end" sideOffset={8}>
				{#if voiceSession.connected}
					<!-- Connected view: current channel with controls -->
					<div class="flex items-center gap-2 border-b px-3 py-2">
						<Signal class="h-3.5 w-3.5 text-emerald-400" />
						<div class="flex flex-1 flex-col">
							<span class="text-xs font-medium text-emerald-400">Salon vocal</span>
							<span class="text-[11px] text-muted-foreground">{displayName}</span>
						</div>
						<Tooltip.Root>
							<Tooltip.Trigger>
								<Button variant="ghost" size="icon" class="h-7 w-7" onclick={handleToggleMute}>
									{#if voiceSession.isMuted}
										<MicOff class="h-3.5 w-3.5 text-destructive" />
									{:else}
										<Mic class="h-3.5 w-3.5" />
									{/if}
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content>
								<p class="text-xs">
									{voiceSession.isMuted ? "Activer le micro" : "Couper le micro"}
								</p>
							</Tooltip.Content>
						</Tooltip.Root>
						<Tooltip.Root>
							<Tooltip.Trigger>
								<Button variant="ghost" size="icon" class="h-7 w-7" onclick={handleDisconnect}>
									<PhoneOff class="h-3.5 w-3.5 text-red-400" />
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content>
								<p class="text-xs">Se déconnecter</p>
							</Tooltip.Content>
						</Tooltip.Root>
					</div>

					<!-- Connected participant list -->
					<div class="max-h-48 overflow-y-auto px-2 py-1.5">
						{#each voiceSession.participants as p (p.identity)}
							{#snippet participantRow()}
								<div
									class="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50 w-full">
									<Avatar.Root
										class={cn(
											"h-7 w-7 border-2 transition-all",
											p.isSpeaking
												? "border-emerald-400 ring-2 ring-emerald-400/30"
												: "border-transparent",
										)}>
										<Avatar.Fallback class="text-[10px]">
											{p.name?.slice(0, 2).toUpperCase() ?? "??"}
										</Avatar.Fallback>
									</Avatar.Root>
									<div class="flex flex-1 flex-col">
										<span class="text-xs font-medium">
											{p.name}
											{#if p.isLocal}
												<span class="text-muted-foreground">(vous)</span>
											{/if}
										</span>
										{#if p.isSpeaking}
											<span class="text-[10px] text-emerald-400">En train de parler</span>
										{/if}
									</div>
									<div class="flex items-center gap-1">
										{#if !p.audioEnabled}
											<MicOff class="h-3 w-3 text-destructive/60" />
										{:else if p.isSpeaking}
											<Volume2 class="h-3 w-3 animate-pulse text-emerald-400" />
										{/if}
									</div>
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
						{#if voiceSession.participants.length === 0}
							<p class="py-2 text-center text-xs text-muted-foreground">Aucun participant</p>
						{/if}
					</div>
				{:else}
					<!-- Not connected: show all active channels -->
					<div class="border-b px-3 py-2">
						<div class="flex items-center gap-2">
							<Headphones class="h-3.5 w-3.5 text-muted-foreground" />
							<span class="text-xs font-medium">Salons vocaux actifs</span>
						</div>
					</div>
					<div class="max-h-60 overflow-y-auto px-2 py-1.5">
						{#each activeChannels as channel (channel.roomName)}
							{@const dedupedParticipants = (() => {
								const seen = new Set<string>();
								return channel.participants.filter((p) => {
									if (seen.has(p.identity)) return false;
									seen.add(p.identity);
									return true;
								});
							})()}
							<div class="mb-1.5 last:mb-0">
								<div class="flex items-center gap-1.5 px-2 py-1">
									<Volume2 class="h-3 w-3 text-muted-foreground" />
									<span class="text-[11px] font-medium text-muted-foreground">
										{chatStore.rooms.find((r) => r.id === channel.roomName)?.name ?? channel.roomName}
									</span>
									<span class="ml-auto text-[10px] text-muted-foreground/60">
										{dedupedParticipants.length}
									</span>
								</div>
								{#each dedupedParticipants as p (p.identity)}
									<div class="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/50">
										<Avatar.Root class="h-5 w-5 border border-transparent">
											<Avatar.Fallback class="text-[8px]">
												{p.name?.slice(0, 2).toUpperCase() ?? "??"}
											</Avatar.Fallback>
										</Avatar.Root>
										<span class="text-xs text-muted-foreground">{p.name}</span>
									</div>
								{/each}
							</div>
						{/each}
					</div>
				{/if}
			</Popover.Content>
		</Popover.Root>
	</div>
{/if}
