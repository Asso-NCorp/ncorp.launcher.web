import type { InstallableGameExtended } from "$lib/types";

/**
 * @description Holds the state of the reinstall confirmation modal
 */
class ReinstallModalState {
    /**
     * @description Whether the modal is open
     * @type {boolean}
     * @default false
     * @memberof ReinstallModalState
     */
    isOpen: boolean = $state<boolean>(false);

    /**
     * @description The game being reinstalled
     * @type {InstallableGameExtended | null}
     * @default null
     * @memberof ReinstallModalState
     */
    game: InstallableGameExtended | null = $state<InstallableGameExtended | null>(null);

    /**
     * @description Opens the modal for a specific game
     * @param {InstallableGameExtended} game - The game to reinstall
     * @memberof ReinstallModalState
     */
    open(game: InstallableGameExtended) {
        this.game = game;
        this.isOpen = true;
    }

    /**
     * @description Closes the modal and clears the game
     * @memberof ReinstallModalState
     */
    close() {
        this.isOpen = false;
        this.game = null;
    }
}

export const reinstallModalStore = new ReinstallModalState();
