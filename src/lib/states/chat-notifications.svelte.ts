import type { LiveUser } from "$src/lib/shared-models";

export interface ChatNotification {
    channelId: string;
    channelName: string;
    senderName: string;
    senderId: string;
    lastMessagePreview: string;
    timestamp: Date;
    unreadCount: number;
}

class ChatNotificationManager {
    notifications: Map<string, ChatNotification> = $state(new Map());
    unreadChannels: Set<string> = $state(new Set());

    addNotification(notification: ChatNotification): void {
        const existing = this.notifications.get(notification.channelId);
        if (existing) {
            this.notifications.set(notification.channelId, {
                ...existing,
                unreadCount: existing.unreadCount + 1,
                lastMessagePreview: notification.lastMessagePreview,
                timestamp: notification.timestamp,
                senderName: notification.senderName,
                senderId: notification.senderId,
            });
        } else {
            this.notifications.set(notification.channelId, notification);
        }
        this.unreadChannels.add(notification.channelId);
    }

    clearNotification(channelId: string): void {
        this.notifications.delete(channelId);
        this.unreadChannels.delete(channelId);
    }

    clearAll(): void {
        this.notifications.clear();
        this.unreadChannels.clear();
    }

    getUnreadCount(): number {
        let total = 0;
        for (const notification of this.notifications.values()) {
            total += notification.unreadCount;
        }
        return total;
    }

    hasUnread(): boolean {
        return this.unreadChannels.size > 0;
    }

    getNotificationsByChannelId(channelId: string): ChatNotification | undefined {
        return this.notifications.get(channelId);
    }

    getAllNotifications(): ChatNotification[] {
        return Array.from(this.notifications.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
}

export const chatNotifications = new ChatNotificationManager();
