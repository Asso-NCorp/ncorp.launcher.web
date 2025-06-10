import type { InstallableGame } from '../shared-models';
import type { InstallableGameExtended } from '../types';

export function extendGames(games: InstallableGame[]): InstallableGameExtended[] {
    return games.map(game => ({
        ...game,
        isSelected: false,
        isInstalled: false,
        isInstalling: false,
        isLoading: false,
        isUpdating: false,
        installProgress: 0
    }));
}