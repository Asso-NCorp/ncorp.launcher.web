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
};

export type InstallableGameExtended = InstallableGame & InstallableGameUI;