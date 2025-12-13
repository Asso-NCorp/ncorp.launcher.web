import type { InstallableGameExtended } from "$lib/types";

/**
 * @description Holds the state of the uninstall confirmation modal
 */
class UninstallModalState {
    /**
     * @description Whether the modal is open
     * @type {boolean}
     * @default false
     * @memberof UninstallModalState
     */
    isOpen: boolean = $state<boolean>(false);

    /**
     * @description The game being uninstalled
     * @type {InstallableGameExtended | null}
     * @default null
     * @memberof UninstallModalState
     */
    game: InstallableGameExtended | null = $state<InstallableGameExtended | null>(null);

    /**
     * @description Opens the modal for a specific game
     * @param {InstallableGameExtended} game - The game to uninstall
     * @memberof UninstallModalState
     */
    open(game: InstallableGameExtended) {
        this.game = game;
        this.isOpen = true;
    }

    /**
     * @description Closes the modal and clears the game
     * @memberof UninstallModalState
     */
    close() {
        this.isOpen = false;
        this.game = null;
    }
}

export const uninstallModalStore = new UninstallModalState();
