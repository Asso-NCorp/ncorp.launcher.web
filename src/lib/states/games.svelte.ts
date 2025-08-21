import { toast } from "svelte-sonner";
import { FetchError } from "../shared-models";
import type { InstallableGameExtended as InstallableGame } from "../types";
import { global } from "../states/global.svelte";
import { liveUsers } from "../states/live-users.svelte";
import { getLocalApi, getServerApi } from "../utils";
import { liveAgentConnection } from "../states/live-agent.svelte";
import { extendGames } from "../utils/games";

class GameStore {
    games: InstallableGame[] = $state([]);
    selected: InstallableGame[] = $derived(this.games.filter((game) => game.isSelected));
    isLoading = $state(false);
    private allGames: InstallableGame[] = $state([]);

    setGames(games: InstallableGame[]) {
        this.allGames = games;
        this.games = games;
    }

    get(gameSlug: string): InstallableGame | undefined {
        return this.allGames.find((game) => game.folderSlug === gameSlug);
    }

    select(game: InstallableGame) {
        game.isSelected = true;
    }

    deselect(gameSlug: string) {
        const game = this.get(gameSlug);
        if (game) {
            game.isSelected = false;
        }
    }

    toggleSelect(gameSlug: string, checked: boolean) {
        const game = this.get(gameSlug);
        if (game) {
            game.isSelected = !checked;
        }
    }

    async syncPlayingGames() {
        await getLocalApi().syncPlayingGames();
    }

    setGameInstallProgress(gameSlug: string, progress: number) {
        const game = this.get(gameSlug);
        if (game) {
            game.installProgress = progress;
        }
    }

    setGameIsInstalled(gameSlug: string, isInstalled: boolean) {
        const game = this.get(gameSlug);
        if (game) {
            game.isInstalled = isInstalled;
            if (isInstalled) {
                game.isInstalling = false;
                game.installProgress = 100;
            } else {
                game.isInstalling = false;
                game.installProgress = 0;
            }
        }
    }

    getGameCover = (gameSlug: string): string => {
        const game = this.get(gameSlug);
        if (game && game.cover) {
            return `/api/resources/${game.cover}`;
        }
        return "/img/not_found.webp"; // Default cover image
    };

    getGameScreenshot = (gameSlug: string): string => {
        const game = this.get(gameSlug);
        const gameScreenShots = game?.screenshots || [];
        // Choose first screenshot if available
        if (gameScreenShots.length > 0) {
            return `/api/resources/${gameScreenShots[0]}`;
        }
        return "/img/not_found.webp"; // Default screenshot image
    };

    setGamePlayingState(userId: string, gameSlug: string, isPlaying: boolean) {
        const game = this.get(gameSlug);
        if (game) {
            if (userId === global.currentUser?.id) {
                game.isPlaying = isPlaying;
            }

            if (isPlaying) {
                liveUsers.updateUserActivity(userId, `Joue à ${game.title}`);
            } else {
                liveUsers.updateUserActivity(userId, undefined);
            }
        } else {
            console.error(`Game with folder slug ${gameSlug} not found`);
            liveUsers.updateUserActivity(userId, "Joue à un jeu");
        }
    }

    resetGamePlayingState(userId: string) {
        this.games.forEach((game) => {
            if (game.isPlaying) {
                game.isPlaying = false;
                liveUsers.updateUserActivity(userId, undefined);
            }
        });
    }

    has(gameSlug: string) {
        return this.games.some((game) => game.folderSlug === gameSlug);
    }

    resetSelected() {
        this.games.forEach((game) => (game.isSelected = false));
    }

    clearSearch = () => {
        global.gamesSearchQuery = "";
        // By default, all modes are selected
        this.search(global.gamesSearchQuery, ["SOLO", "COOP", "MULTI"]);
    };

    search = (searchQuery: string = global.gamesSearchQuery, modesSelected: string[] = ["SOLO", "COOP", "MULTI"]) => {
        const query = searchQuery.toLowerCase();

        // Defensive: ensure modesSelected is always an array
        if (!Array.isArray(modesSelected)) {
            modesSelected = [];
        }

        // If no modes selected, show nothing
        if (modesSelected.length === 0) {
            this.games = [];
            return;
        }

        const allModesChecked = modesSelected.length === 3;

        this.games = this.allGames.filter((game) => {
            // Title filter
            const titleMatch = !query || game.title?.toLowerCase().includes(query);

            // Modes filter
            const gameModes = game.gameModes || [];

            if (allModesChecked) {
                // If all modes checked, include games with no modes or any modes
                return titleMatch;
            } else {
                // Only include games with at least one selected mode
                if (!Array.isArray(gameModes) || gameModes.length === 0) return false;
                return titleMatch && gameModes.some((mode) => modesSelected.includes(mode));
            }
        });
    };

    installGame = async (game: InstallableGame) => {
        if (!game.isInstalled) {
            try {
                game.isInstalling = true;
                const result = await getLocalApi().install({
                    installableGame: game,
                });
                if (!result.isSuccess) {
                    toast.error(result.message!);
                }
            } catch (error) {
                if (error instanceof FetchError && error.cause && error.cause.name === "TypeError") {
                    // Gérer spécifiquement les erreurs de réseau
                    console.log("Erreur de réseau:", error.cause);
                } else {
                    console.error(error);
                    game.installError = (error as Error)?.message;
                }
            } finally {
            }
        }
    };

    cancelGameInstallation = async (game: InstallableGame) => {
        try {
            await getLocalApi().cancelInstallation({
                gameSlug: game.folderSlug,
            });
            toast.success("Annulation réussie", {
                class: "bg-green-500",
            });
            this.setGameIsInstalled(game.folderSlug!, false);
            this.deselect(game.folderSlug!);
        } catch (error) {
            console.error(error);
            game.installError = (error as Error)?.message; // Capture the error message
            toast.error("Erreur lors de l'annulation", {
                class: "bg-red-500",
            });
        }
    };

    installGames = async (games: InstallableGame[]) => {
        if (games.length === 0) {
            toast.error("Aucun jeu sélectionné");
            return;
        }
        if (this.isLoading) {
            toast.error("Jeux déjà en cours de chargement");
            return;
        }

        this.isLoading = true;
        let successCount = 0;

        try {
            for (const game of games) {
                try {
                    await this.installGame(game);
                    successCount++;
                } catch (err) {
                    console.error(`Erreur installation ${game.title}`, err);
                    toast.error(`Erreur sur ${game.title}`);
                }
            }

            if (successCount > 0)
                toast.success(`L'installation de ${successCount} jeu(x) a été ajoutée à la file d'attente`);
            else toast.error("Aucun jeu n'a pu être installé");
        } finally {
            this.isLoading = false;
        }
    };

    uninstallGame = async (game: InstallableGame) => {
        if (game.isInstalled) {
            try {
                game.isLoading = true;
                await getLocalApi().deleteGame({
                    gameSlug: game.folderSlug,
                });
                toast.success("Désinstallation réussie", {
                    class: "bg-green-500",
                });
            } catch (error) {
                console.error(error);
                game.installError = (error as Error)?.message; // Capture the error message
                toast.error("Erreur lors de la désinstallation", {
                    class: "bg-red-500",
                });
            } finally {
                GamesStore.setGameIsInstalled(game.folderSlug!, false);
                GamesStore.deselect(game.folderSlug!);
                game.isLoading = false;
            }
        }
    };

    uninstallGames = async (games: InstallableGame[]) => {
        if (games.length === 0) {
            toast.error("Aucun jeu sélectionné");
            return;
        }
        if (this.isLoading) {
            toast.error("Jeux déjà en cours de chargement");
            return;
        }

        this.isLoading = true;
        let successCount = 0;

        try {
            for (const game of games) {
                try {
                    game.isLoading = true;
                    await this.uninstallGame(game);
                    successCount++;
                } catch (err) {
                    console.error(`Erreur désinstallation ${game.title}`, err);
                    toast.error(`Erreur sur ${game.title}`);
                } finally {
                    GamesStore.deselect(game.folderSlug!);
                    GamesStore.setGameIsInstalled(game.folderSlug!, false);
                    game.isLoading = false;
                }
            }

            if (successCount > 0) toast.success(`${successCount} jeu(x) désinstallé(s)`);
            else toast.error("Aucun jeu n'a pu être désinstallé");
        } finally {
            this.isLoading = false;
        }
    };

    getAvailableGames = async () => {
        if (this.isLoading) {
            console.warn("Games are already loading");
            return false;
        }

        this.isLoading = true;
        let games: InstallableGame[] = [];
        let installedGames: InstallableGame[] = [];
        const serverApi = getServerApi();
        const localApi = getLocalApi();

        try {
            // Get games from the server
            games = extendGames(
                await serverApi.getAvailableGames({
                    sort: global.gamesSortOrder,
                }),
            );
        } catch (error) {
            console.error(error);
            toast.error("Impossible de récupérer les jeux disponibles. Veuillez vérifier la connexion au serveur");
            return false;
        } finally {
            this.isLoading = false;
        }

        try {
            // Get installed games locally
            installedGames = extendGames(await localApi.getInstalledGames());
        } catch (error) {
            console.error(error);
            toast.error("Impossible de récupérer les jeux installés. Veuillez vérifier l'agent");
            installedGames = [];
        } finally {
            this.isLoading = false;
        }

        try {
            // Merge games with installed games to get the isInstalled and isPlaying status
            const mergedGames = games.map((game) => ({
                ...game,
                isInstalled: installedGames.some(
                    (installedGame) => installedGame.folderSlug === game.folderSlug && installedGame.isInstalled,
                ),
                isPlaying: installedGames.some(
                    (installedGame) => installedGame.folderSlug === game.folderSlug && installedGame.isPlaying,
                ),
            }));

            // Load the games into the state
            GamesStore.setGames(mergedGames);
        } catch (error) {
            toast.error("Impossible de charger les jeux");
            console.error(error);
            return false;
        } finally {
            this.isLoading = false;
        }

        try {
            if (liveAgentConnection?.isConnected && global.localGamesFolder) {
                // Sync the installed games with the server
                await GamesStore.syncPlayingGames();
            }
        } catch (error) {
            console.error(error);
            toast.error("Impossible de synchroniser les jeux installés. Veuillez vérifier l'agent");
            return false;
        } finally {
            GamesStore.isLoading = false;
            this.isLoading = false;
        }

        return true;
    };

    async deleteGame(gameSlug: string) {
        try {
            const deleted = await getServerApi().deleteGame({ slug: gameSlug });
            if (!deleted) {
                toast.error("Erreur lors de la suppression du jeu");
                return;
            }
            this.games = this.games.filter((game) => game.folderSlug !== gameSlug);
            toast.success("Jeu supprimé avec succès");
        } catch (error) {
            toast.error("Erreur lors de la suppression du jeu");
            console.error(error);
        }
    }

    resetGamesPlayingStates = () => {
        this.games.forEach((game) => {
            if (game.isPlaying) {
                game.isPlaying = false;
            }
        });
    };

    uninstallAllInstalledGames = async () => {
        try {
            for (const game of this.games) {
                if (game.isInstalled) {
                    await this.uninstallGame(game);
                }
            }
            toast.success("Tous les jeux installés ont été désinstallés");
        } catch (error) {
            console.error("Erreur lors de la désinstallation", error);
            toast.error("Erreur lors de la désinstallation");
        }
    };
}
export const GamesStore = new GameStore();
