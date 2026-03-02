<script lang="ts">
	import { Signal, Mic, MicOff, PhoneOff, Volume2 } from "@lucide/svelte";
	import { Button } from "$lib/components/ui/button";
	import * as Popover from "$lib/components/ui/popover";
	import * as Tooltip from "$lib/components/ui/tooltip";
	import * as Avatar from "$lib/components/ui/avatar";
	import { cn } from "$lib/utils";
	import { voiceSession } from "$lib/chat/chat.svelte";
	import { fade } from "svelte/transition";

	const participantCount = $derived(voiceSession.participants.length);
	const displayName = $derived(voiceSession.roomDisplayName || voiceSession.roomName);
	const speakingNames = $derived(
		voiceSession.participants
			.filter((p) => p.isSpeaking && !p.isLocal)
			.map((p) => p.name)
			.slice(0, 3),
	);

	async function handleToggleMute() {
		await voiceSession.toggleMute();
	}

	async function handleDisconnect() {
		await voiceSession.disconnect();
	}
</script>

{#if voiceSession.connected}
	<div class="flex h-full items-center border-l" transition:fade={{ duration: 150 }}>
		<Popover.Root>
			<Popover.Trigger>
				<button
					class="group flex h-full items-center gap-2 px-3 transition-colors hover:bg-accent">
					<!-- Pulsing green dot -->
					<span class="relative flex h-2.5 w-2.5">
						<span
							class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
						></span>
						<span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
					</span>

					<!-- Channel name & speaking info -->
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

					<!-- Quick speaker avatars -->
					{#if voiceSession.participants.length > 0}
						<div class="flex -space-x-1.5">
							{#each voiceSession.participants.slice(0, 3) as p (p.identity)}
								<Avatar.Root
									class={cn(
										"h-5 w-5 border transition-all",
										p.isSpeaking
											? "border-emerald-400 ring-1 ring-emerald-400/50"
											: "border-background",
									)}>
									<Avatar.Fallback class="text-[8px]">
										{p.name?.slice(0, 2).toUpperCase() ?? "??"}
									</Avatar.Fallback>
								</Avatar.Root>
							{/each}
							{#if voiceSession.participants.length > 3}
								<span
									class="flex h-5 w-5 items-center justify-center rounded-full border border-background bg-muted text-[8px]">
									+{voiceSession.participants.length - 3}
								</span>
							{/if}
						</div>
					{/if}
				</button>
			</Popover.Trigger>

			<Popover.Content class="w-72 p-0" align="end" sideOffset={8}>
				<!-- Header -->
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

				<!-- Participant list -->
				<div class="max-h-48 overflow-y-auto px-2 py-1.5">
					{#each voiceSession.participants as p (p.identity)}
						<div
							class="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50">
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
					{/each}
					{#if voiceSession.participants.length === 0}
						<p class="py-2 text-center text-xs text-muted-foreground">Aucun participant</p>
					{/if}
				</div>
			</Popover.Content>
		</Popover.Root>
	</div>
{/if}
