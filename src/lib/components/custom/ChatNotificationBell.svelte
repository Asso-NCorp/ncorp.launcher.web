<script lang="ts">
	import { chatNotifications, type ChatNotification } from "$src/lib/states/chat-notifications.svelte";
	import { chatStore } from "$src/lib/chat/chat.svelte";
	import { goto } from "$app/navigation";
	import { Bell, X } from "@lucide/svelte";
	import { cn } from "$src/lib/utils";
	import { fade } from "svelte/transition";

	let { class: klazz }: { class?: string } = $props();
	let expanded = $state(false);

	const notifications: ChatNotification[] = $derived(chatNotifications.getAllNotifications());
	const totalUnread: number = $derived(chatNotifications.getUnreadCount());

	function handleNotificationClick(notification: ChatNotification) {
		chatNotifications.clearNotification(notification.channelId);
		
		// Find the room to determine if it's a DM or server channel
		const room = chatStore.rooms.find((r) => r.id === notification.channelId);
		
		// If room found, use room info to navigate
		if (room) {
			if (room.type === "DM" || room.type === "GROUP") {
				goto(`/chat/channels/@me/${notification.channelId}`);
			} else if (room.guildId) {
				goto(`/chat/channels/${room.guildId}/${notification.channelId}`);
			}
		} else {
			// Fallback: assume it's a DM since those are the ones creating new rooms
			console.log("[ChatNotificationBell] Room not found in list, assuming DM:", notification.channelId);
			goto(`/chat/channels/@me/${notification.channelId}`);
		}
		expanded = false;
	}

	function handleDismiss(notification: ChatNotification, e: Event) {
		e.stopPropagation();
		chatNotifications.clearNotification(notification.channelId);
	}

	function handleDismissAll() {
		chatNotifications.clearAll();
		expanded = false;
	}
</script>

{#if totalUnread > 0}
	<div class={cn("relative", klazz)} transition:fade={{ duration: 200 }}>
		<button
			onclick={() => (expanded = !expanded)}
			class="relative inline-flex items-center justify-center rounded-lg p-2 hover:bg-accent hover:text-accent-foreground"
			title="Chat notifications"
		>
			<Bell class="h-5 w-5" />
			{#if totalUnread > 0}
				<span class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
					{totalUnread > 99 ? "99+" : totalUnread}
				</span>
			{/if}
		</button>

		{#if expanded}
			<div
				class="absolute right-0 top-full z-50 mt-2 w-80 max-w-sm rounded-lg border border-border bg-card p-0 shadow-lg"
				transition:fade={{ duration: 150 }}
			>
				<div class="flex items-center justify-between border-b border-border px-4 py-3">
					<h3 class="font-semibold">Chat Notifications ({totalUnread})</h3>
					<button
						onclick={handleDismissAll}
						class="text-xs text-muted-foreground hover:text-foreground"
					>
						Clear all
					</button>
				</div>

				<div class="max-h-96 overflow-y-auto">
					{#each notifications as notification (notification.channelId)}
						<div
							onclick={() => handleNotificationClick(notification)}
							class="w-full border-b border-border px-4 py-3 text-left hover:bg-accent transition-colors duration-150 last:border-b-0 cursor-pointer"
						>
							<div class="flex items-start justify-between gap-2">
								<div class="flex-1 min-w-0">
									<div class="font-semibold text-sm truncate">{notification.channelName}</div>
									<div class="text-xs text-muted-foreground mt-1">
										<span class="font-medium">{notification.senderName}:</span>
										<span class="truncate line-clamp-2">
											{notification.lastMessagePreview}
										</span>
									</div>
									<div class="text-xs text-muted-foreground mt-1">
										{notification.unreadCount} {notification.unreadCount === 1 ? "message" : "messages"}
									</div>
								</div>
								<div
									onclick={(e) => {
										e.stopPropagation();
										handleDismiss(notification, e);
									}}
									class="rounded p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer"
								>
									<X class="h-4 w-4" />
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	:global(.line-clamp-2) {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		line-clamp: 2;
	}
</style>

