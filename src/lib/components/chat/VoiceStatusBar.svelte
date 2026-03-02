<script lang="ts">
	import {
		Mic,
		MicOff,
		PhoneOff,
		Monitor,
		MonitorOff,
		Settings,
		Signal,
		ChevronDown,
	} from "@lucide/svelte";
	import { Button } from "$lib/components/ui/button";
	import * as Tooltip from "$lib/components/ui/tooltip";
	import { cn } from "$lib/utils";
	import { voiceSession } from "$lib/chat/chat.svelte";

	let showDevices = $state(false);

	async function handleToggleMute() {
		await voiceSession.toggleMute();
	}

	async function handleDisconnect() {
		await voiceSession.disconnect();
	}

	async function handleToggleScreenShare() {
		await voiceSession.toggleScreenShare();
	}

	function handleToggleDevices() {
		showDevices = !showDevices;
		if (showDevices) {
			voiceSession.refreshAudioDevices(true);
		}
	}

	async function selectDevice(deviceId: string) {
		await voiceSession.setMicrophoneDevice(deviceId);
		showDevices = false;
	}

	const participantCount = $derived(voiceSession.participants.length);
	const micLevelPct = $derived(Math.min(voiceSession.micLevel / 0.1, 1) * 100);
	const thresholdPct = $derived(Math.min(voiceSession.noiseGateThreshold / 0.1, 1) * 100);
	const gateOpen = $derived(
		voiceSession.noiseGateThreshold === 0 ||
			voiceSession.micLevel >= voiceSession.noiseGateThreshold,
	);
</script>

<div class="border-t bg-muted/50">
	<!-- Device + noise gate panel (always accessible) -->
	{#if showDevices}
		<div class="border-b px-3 py-2">
			<p class="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
				Microphone
			</p>
			<div class="flex flex-col gap-0.5">
				{#each voiceSession.audioDevices as device (device.deviceId)}
					<button
						class={cn(
							"w-full rounded px-2 py-1 text-left text-xs transition-colors hover:bg-muted",
							device.deviceId === voiceSession.selectedAudioDeviceId &&
								"bg-primary/10 text-primary font-medium",
						)}
						onclick={() => selectDevice(device.deviceId)}>
						{device.label}
					</button>
				{/each}
				{#if voiceSession.audioDevices.length === 0}
					<p class="px-2 py-1 text-xs text-muted-foreground">Aucun périphérique détecté</p>
				{/if}
			</div>

			<!-- Noise gate -->
			<div class="mt-2.5 border-t pt-2">
				<div class="mb-1.5 flex items-center justify-between">
					<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
						Noise Gate
					</p>
					<span class="text-[10px] text-muted-foreground">
						{voiceSession.noiseGateThreshold === 0
							? "Désactivé"
							: `${Math.round(voiceSession.noiseGateThreshold * 1000)}%`}
					</span>
				</div>

				<!-- Live mic level meter -->
				<div class="relative mb-2 h-2 overflow-hidden rounded-full bg-muted">
					<div
						class={cn(
							"absolute inset-y-0 left-0 rounded-full transition-none",
							gateOpen ? "bg-emerald-500" : "bg-muted-foreground/40",
						)}
						style="width: {micLevelPct}%">
					</div>
					{#if voiceSession.noiseGateThreshold > 0}
						<div
							class="absolute inset-y-0 w-px bg-primary/80"
							style="left: {thresholdPct}%">
						</div>
					{/if}
				</div>

				<input
					type="range"
					min="0"
					max="100"
					step="1"
					value={Math.round(voiceSession.noiseGateThreshold * 1000)}
					oninput={(e) =>
						voiceSession.setNoiseGateThreshold(
							(e.currentTarget as HTMLInputElement).valueAsNumber / 1000,
						)}
					class="h-1.5 w-full cursor-pointer accent-primary" />
				<p class="mt-1 text-[9px] text-muted-foreground">Seuil avant activation du micro</p>
			</div>
		</div>
	{/if}

	{#if voiceSession.connected}
		<!-- Connection info -->
		<div class="flex items-center gap-2 px-3 py-1.5">
			<div class="flex items-center gap-1.5">
				<Signal class="h-3.5 w-3.5 text-emerald-400" />
				<div class="flex flex-col">
					<span class="text-xs font-medium text-emerald-400">Connecté</span>
					<span class="max-w-[120px] truncate text-[10px] text-muted-foreground">
						{voiceSession.roomDisplayName || voiceSession.roomName}
						{#if participantCount > 0}
							· {participantCount} {participantCount === 1 ? "personne" : "personnes"}
						{/if}
					</span>
				</div>
			</div>
		</div>

		<!-- Controls row -->
		<div class="flex items-center justify-around px-2 pb-2">
			<!-- Mute -->
			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button
							variant={voiceSession.isMuted ? "destructive" : "ghost"}
							size="icon"
							class="h-8 w-8"
							onclick={handleToggleMute}>
							{#if voiceSession.isMuted}
								<MicOff class="h-4 w-4" />
							{:else}
								<Mic class="h-4 w-4" />
							{/if}
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p class="text-xs">{voiceSession.isMuted ? "Activer le micro" : "Couper le micro"}</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>

			<!-- Screen Share -->
			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button
							variant={voiceSession.screenSharing ? "secondary" : "ghost"}
							size="icon"
							class="h-8 w-8"
							onclick={handleToggleScreenShare}>
							{#if voiceSession.screenSharing}
								<MonitorOff class="h-4 w-4" />
							{:else}
								<Monitor class="h-4 w-4" />
							{/if}
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p class="text-xs">
							{voiceSession.screenSharing ? "Arrêter le partage" : "Partager l'écran"}
						</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>

			<!-- Audio settings -->
			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button variant="ghost" size="icon" class="h-8 w-8" onclick={handleToggleDevices}>
							{#if showDevices}
								<ChevronDown class="h-4 w-4" />
							{:else}
								<Settings class="h-4 w-4" />
							{/if}
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p class="text-xs">Paramètres audio</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>

			<!-- Disconnect -->
			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button variant="ghost" size="icon" class="h-8 w-8" onclick={handleDisconnect}>
							<PhoneOff class="h-4 w-4 text-red-400" />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p class="text-xs">Se déconnecter</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>
		</div>

		<!-- Error message -->
		{#if voiceSession.errorMsg}
			<div class="px-3 pb-2">
				<p class="text-xs text-red-400">{voiceSession.errorMsg}</p>
			</div>
		{/if}
	{:else}
		<!-- Not connected: just the settings toggle -->
		<div class="flex items-center justify-end px-2 py-1">
			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button variant="ghost" size="icon" class="h-7 w-7" onclick={handleToggleDevices}>
							{#if showDevices}
								<ChevronDown class="h-3.5 w-3.5" />
							{:else}
								<Settings class="h-3.5 w-3.5" />
							{/if}
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p class="text-xs">Paramètres audio</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>
		</div>
	{/if}
</div>
