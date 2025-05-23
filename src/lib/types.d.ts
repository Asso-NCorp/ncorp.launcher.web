import { type Icon as IconType } from "@lucide/svelte";

export type SideMenuSubItemProps = {
    href?: string;
    icon?: typeof IconType;
    class?: string;
    iconClass?: string;
    label: string;
    onClick?: () => void;
    iconOnly?: boolean;
};