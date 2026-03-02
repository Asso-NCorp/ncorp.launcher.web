<script lang="ts">
	import {
		Mic,
		MicOff,
		Headphones,
		VolumeX,
		ChevronUp,
		Settings,
		ChevronDown,
		PhoneOff,
		Monitor,
		MonitorOff,
		Activity,
		Square,
		Volume2,
	} from "@lucide/svelte";
	import { cn } from "$lib/utils";
	import { voiceSession } from "$lib/chat/chat.svelte";

	let container: HTMLElement;
	let showMicMenu = $state(false);
	let showVolumeMenu = $state(false);
	let showSettings = $state(false);

	// Close dropdowns on outside click
	$effect(() => {
		if (!showMicMenu && !showVolumeMenu && !showSettings) return;
		function onPointerDown(e: PointerEvent) {
			if (!container?.contains(e.target as Node)) {
				const wasMicMenuOpen = showMicMenu;
				const wasSettingsOpen = showSettings;
				showMicMenu = false;
				showVolumeMenu = false;
				showSettings = false;
				// Stop mic preview when closing menus (if not connected)
				if ((wasMicMenuOpen || wasSettingsOpen) && !voiceSession.connected && voiceSession.micTestActive) {
					voiceSession.stopMicPreview();
				}
			}
		}
		window.addEventListener("pointerdown", onPointerDown);
		return () => window.removeEventListener("pointerdown", onPointerDown);
	});

	// Derived meter values
	const micLevelPct = $derived(Math.min(voiceSession.micLevel / 0.1, 1) * 100);
	const thresholdPct = $derived(Math.min(voiceSession.noiseGateThreshold / 0.1, 1) * 100);
	const ceilingPct = $derived(Math.min(voiceSession.noiseCeilingThreshold / 0.1, 1) * 100);
	const gateOpen = $derived(() => {
		const aboveMin =
			voiceSession.noiseGateThreshold === 0 ||
			voiceSession.micLevel >= voiceSession.noiseGateThreshold;
		const belowMax =
			voiceSession.noiseCeilingThreshold === 0 ||
			voiceSession.micLevel <= voiceSession.noiseCeilingThreshold;
		return aboveMin && belowMax;
	});

	function toggleMicMenu() {
		showVolumeMenu = false;
		showMicMenu = !showMicMenu;
		if (showMicMenu) voiceSession.refreshAudioDevices(false);
	}

	function toggleVolumeMenu() {
		showMicMenu = false;
		showVolumeMenu = !showVolumeMenu;
	}

	function toggleSettingsPanel() {
		showSettings = !showSettings;
		if (showSettings) {
			voiceSession.refreshAudioDevices(true);
		} else {
			// Stop mic preview when closing settings panel
			if (voiceSession.micTestActive) {
				voiceSession.stopMicPreview();
			}
		}
	}

	async function selectDevice(deviceId: string) {
		await voiceSession.setMicrophoneDevice(deviceId);
	}
</script>

<div bind:this={container} class="border-t bg-muted/50">
	<div class="relative mx-2 mb-3 mt-2">
		<!-- Mic dropdown (always available) -->
		{#if showMicMenu}
			<div
				class="absolute bottom-full left-0 right-0 z-50 mb-1.5 rounded-lg border bg-popover p-2.5 shadow-lg">
				<p
					class="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
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
						<p
							class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
							Noise Gate
						</p>
						<div class="flex items-center gap-1">
							{#if voiceSession.micTestActive}
								<button
									class={cn(
										"flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition-colors",
										voiceSession.loopbackEnabled
											? "bg-primary/20 text-primary"
											: "bg-muted hover:bg-muted/80 text-muted-foreground",
									)}
									onclick={() => voiceSession.toggleLoopback()}
									title="Retour audio (s'entendre)">
									<Volume2 class="h-2.5 w-2.5" />
								</button>
							{/if}
							<button
								class={cn(
									"flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition-colors",
									voiceSession.micTestActive
										? "bg-emerald-500/20 text-emerald-500"
										: "bg-muted hover:bg-muted/80 text-muted-foreground",
								)}
								onclick={() => voiceSession.toggleMicPreview()}
								disabled={voiceSession.connected}>
								{#if voiceSession.micTestActive}
									<Square class="h-2.5 w-2.5" />
									Arrêter
								{:else}
									<Activity class="h-2.5 w-2.5" />
									Tester
								{/if}
							</button>
						</div>
					</div>
					<div class="relative mb-2 h-1.5 overflow-hidden rounded-full bg-muted">
						<div
							class={cn(
								"absolute inset-y-0 left-0 rounded-full transition-none",
								gateOpen() ? "bg-emerald-500" : "bg-red-500",
							)}
							style="width: {micLevelPct}%"></div>
						{#if voiceSession.noiseGateThreshold > 0}
							<div
								class="absolute inset-y-0 w-0.5 bg-primary/80"
								style="left: {thresholdPct}%"
								title="Seuil minimum"></div>
						{/if}
						{#if voiceSession.noiseCeilingThreshold > 0}
							<div
								class="absolute inset-y-0 w-0.5 bg-orange-500/80"
								style="left: {ceilingPct}%"
								title="Seuil maximum"></div>
						{/if}
					</div>
					<!-- Min threshold slider -->
					<div class="mb-2">
						<div class="mb-1 flex items-center justify-between">
							<span class="text-[9px] text-muted-foreground">Seuil min</span>
							<span class="text-[9px] text-muted-foreground">
								{voiceSession.noiseGateThreshold === 0
									? "Désactivé"
									: `${Math.round(voiceSession.noiseGateThreshold * 1000)}%`}
							</span>
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
					</div>
					<!-- Max threshold slider -->
					<div>
						<div class="mb-1 flex items-center justify-between">
							<span class="text-[9px] text-muted-foreground">Seuil max</span>
							<span class="text-[9px] text-muted-foreground">
								{voiceSession.noiseCeilingThreshold === 0
									? "Désactivé"
									: `${Math.round(voiceSession.noiseCeilingThreshold * 1000)}%`}
							</span>
						</div>
						<input
							type="range"
							min="0"
							max="100"
							step="1"
							value={Math.round(voiceSession.noiseCeilingThreshold * 1000)}
							oninput={(e) =>
								voiceSession.setNoiseCeilingThreshold(
									(e.currentTarget as HTMLInputElement).valueAsNumber / 1000,
								)}
							class="h-1.5 w-full cursor-pointer accent-orange-500" />
					</div>
					<p class="mt-1.5 text-[9px] text-muted-foreground">
						Le micro n'envoie pas l'audio en dehors de ces seuils
					</p>
				</div>
			</div>
		{/if}

		<!-- Volume dropdown (always available) -->
		{#if showVolumeMenu}
			<div
				class="absolute bottom-full right-0 z-50 mb-1.5 w-52 rounded-lg border bg-popover p-2.5 shadow-lg">
				<div class="mb-2 flex items-center justify-between">
					<p
						class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
						Volume de sortie
					</p>
					<span class="text-xs font-medium">
						{Math.round(voiceSession.outputVolume * 100)}%
					</span>
				</div>
				<input
					type="range"
					min="0"
					max="200"
					step="1"
					value={Math.round(voiceSession.outputVolume * 100)}
					oninput={(e) =>
						voiceSession.setOutputVolume(
							(e.currentTarget as HTMLInputElement).valueAsNumber / 100,
						)}
					class="h-1.5 w-full cursor-pointer accent-primary" />
				<div class="mt-1 flex justify-between">
					<span class="text-[9px] text-muted-foreground">0%</span>
					<span class="text-[9px] text-muted-foreground">100%</span>
					<span class="text-[9px] text-muted-foreground">200%</span>
				</div>
			</div>
		{/if}

		<!-- Settings panel (not connected only) -->
		{#if !voiceSession.connected && showSettings}
			<div
				class="absolute bottom-full left-0 right-0 z-50 mb-1.5 rounded-lg border bg-popover p-2.5 shadow-lg">
				<p
					class="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
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
				<div class="mt-2.5 border-t pt-2">
					<div class="mb-1.5 flex items-center justify-between">
						<p
							class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
							Noise Gate
						</p>
						<div class="flex items-center gap-1">
							{#if voiceSession.micTestActive}
								<button
									class={cn(
										"flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition-colors",
										voiceSession.loopbackEnabled
											? "bg-primary/20 text-primary"
											: "bg-muted hover:bg-muted/80 text-muted-foreground",
									)}
									onclick={() => voiceSession.toggleLoopback()}
									title="Retour audio (s'entendre)">
									<Volume2 class="h-2.5 w-2.5" />
								</button>
							{/if}
							<button
								class={cn(
									"flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition-colors",
									voiceSession.micTestActive
										? "bg-emerald-500/20 text-emerald-500"
										: "bg-muted hover:bg-muted/80 text-muted-foreground",
								)}
								onclick={() => voiceSession.toggleMicPreview()}>
								{#if voiceSession.micTestActive}
									<Square class="h-2.5 w-2.5" />
									Arrêter
								{:else}
									<Activity class="h-2.5 w-2.5" />
									Tester
								{/if}
							</button>
						</div>
					</div>
					<div class="relative mb-2 h-1.5 overflow-hidden rounded-full bg-muted">
						<div
							class={cn(
								"absolute inset-y-0 left-0 rounded-full transition-none",
								gateOpen() ? "bg-emerald-500" : "bg-red-500",
							)}
							style="width: {micLevelPct}%"></div>
						{#if voiceSession.noiseGateThreshold > 0}
							<div
								class="absolute inset-y-0 w-0.5 bg-primary/80"
								style="left: {thresholdPct}%"
								title="Seuil minimum"></div>
						{/if}
						{#if voiceSession.noiseCeilingThreshold > 0}
							<div
								class="absolute inset-y-0 w-0.5 bg-orange-500/80"
								style="left: {ceilingPct}%"
								title="Seuil maximum"></div>
						{/if}
					</div>
					<!-- Min threshold slider -->
					<div class="mb-2">
						<div class="mb-1 flex items-center justify-between">
							<span class="text-[9px] text-muted-foreground">Seuil min</span>
							<span class="text-[9px] text-muted-foreground">
								{voiceSession.noiseGateThreshold === 0
									? "Désactivé"
									: `${Math.round(voiceSession.noiseGateThreshold * 1000)}%`}
							</span>
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
					</div>
					<!-- Max threshold slider -->
					<div>
						<div class="mb-1 flex items-center justify-between">
							<span class="text-[9px] text-muted-foreground">Seuil max</span>
							<span class="text-[9px] text-muted-foreground">
								{voiceSession.noiseCeilingThreshold === 0
									? "Désactivé"
									: `${Math.round(voiceSession.noiseCeilingThreshold * 1000)}%`}
							</span>
						</div>
						<input
							type="range"
							min="0"
							max="100"
							step="1"
							value={Math.round(voiceSession.noiseCeilingThreshold * 1000)}
							oninput={(e) =>
								voiceSession.setNoiseCeilingThreshold(
									(e.currentTarget as HTMLInputElement).valueAsNumber / 1000,
								)}
							class="h-1.5 w-full cursor-pointer accent-orange-500" />
					</div>
					<p class="mt-1.5 text-[9px] text-muted-foreground">
						Le micro n'envoie pas l'audio en dehors de ces seuils
					</p>
				</div>
			</div>
		{/if}

		<!-- ── Widget bar (always visible) ── -->
		<div
			class="flex h-10 items-center rounded-lg border bg-card px-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.25)]">
			<!-- Mic group (always visible) -->
			<button
				class={cn(
					"flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-muted",
					voiceSession.isMuted && "text-destructive",
				)}
				onclick={() => voiceSession.toggleMute()}>
				{#if voiceSession.isMuted}
					<MicOff class="h-4 w-4" />
				{:else}
					<Mic class="h-4 w-4" />
				{/if}
			</button>
			<button
				class={cn(
					"flex h-8 w-4 items-center justify-center rounded transition-colors hover:bg-muted",
					showMicMenu && "bg-muted",
				)}
				onclick={toggleMicMenu}>
				<ChevronUp class="h-3 w-3" />
			</button>

			<div class="mx-1.5 h-5 w-px bg-border"></div>

			<!-- Deafen group (always visible) -->
			<button
				class={cn(
					"flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-muted",
					voiceSession.isDeafened && "text-destructive",
				)}
				onclick={() => voiceSession.toggleDeafen()}>
				{#if voiceSession.isDeafened}
					<VolumeX class="h-4 w-4" />
				{:else}
					<Headphones class="h-4 w-4" />
				{/if}
			</button>
			<button
				class={cn(
					"flex h-8 w-4 items-center justify-center rounded transition-colors hover:bg-muted",
					showVolumeMenu && "bg-muted",
				)}
				onclick={toggleVolumeMenu}>
				<ChevronUp class="h-3 w-3" />
			</button>

			{#if voiceSession.connected}
				<div class="mx-1.5 h-5 w-px bg-border"></div>

				<!-- Screen share -->
				<button
					class={cn(
						"flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-muted",
						voiceSession.screenSharing && "text-primary",
					)}
					onclick={() => voiceSession.toggleScreenShare()}>
					{#if voiceSession.screenSharing}
						<MonitorOff class="h-4 w-4" />
					{:else}
						<Monitor class="h-4 w-4" />
					{/if}
				</button>

				<div class="mx-1.5 h-5 w-px bg-border"></div>

				<!-- Disconnect -->
				<button
					class="flex h-8 w-8 items-center justify-center rounded text-destructive transition-colors hover:bg-destructive/10"
					onclick={() => voiceSession.disconnect()}>
					<PhoneOff class="h-4 w-4" />
				</button>
			{:else}
				<!-- Settings gear (right-aligned, not connected) -->
				<div class="ml-auto">
					<button
						class={cn(
							"flex h-7 w-7 items-center justify-center rounded transition-colors hover:bg-muted",
							showSettings && "bg-muted",
						)}
						onclick={toggleSettingsPanel}>
						{#if showSettings}
							<ChevronDown class="h-3.5 w-3.5" />
						{:else}
							<Settings class="h-3.5 w-3.5" />
						{/if}
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>
