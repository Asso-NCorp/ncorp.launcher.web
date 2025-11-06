import { type Icon as IconType } from "@lucide/svelte";
import type { InstallableGame } from "./shared-models";

export type SideMenuSubItemProps = {
    href?: string;
    icon?: typeof IconType;
    class?: string;
    iconClass?: string;
    label: string;
    onClick?: () => void;
    iconOnly?: boolean;
};

type InstallableGameUI = {
    isSelected: boolean;
    isInstalling: boolean;
    isLoading: boolean;
    isUpdating: boolean;
    installError?: string;
    installProgress: number;
    isCancellingInstall: boolean;
    status?: string;
    eta?: string;
    totalInstallations: number;
    isFavorite: boolean;
};

export interface ServerItemData {
    id: string;
    name: string;
    icon?: string | null;
    active?: boolean;
    unread?: boolean;
}

export interface ChannelItemData {
    id: string; // identifiant unique
    name: string; // nom du channel ou de la personne
    type: "direct" | "group"; // type de conversation
    lastMessage?: string; // aperçu du dernier message
    lastMessageAt?: Date; // date du dernier message
    unreadCount?: number; // nombre de messages non lus
    avatarUrl?: string; // URL d’avatar ou icône
    isActive?: boolean; // si le channel est sélectionné
}

export type InstallableGameExtended = InstallableGame & InstallableGameUI;