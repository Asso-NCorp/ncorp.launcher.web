
import { toast } from "svelte-sonner";
import { FetchError } from "../shared-models";
import type { InstallableGame } from "../shared-models";
import { global } from "../states/global.svelte";
import { liveUsers } from "../states/live-users.svelte";
import { getLocalApi, getServerApi } from "../utils";
import { liveAgentConnection } from "../states/live-agent.svelte";

class GameStore {
    games: InstallableGame[] = $state([]);
    selected: InstallableGame[] = $derived(this.games.filter(game => game.isSelected));
    gamesLoading = $state(false);
    private allGames: InstallableGame[] = $state([]);

    setGames(games: InstallableGame[]) {
        this.allGames = games;
        this.games = games
    }

    get(gameSlug: string): InstallableGame | undefined {
        return this.games.find(game => game.folderSlug === gameSlug);
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
            liveUsers.updateUserActivity(userId, 'Joue à un jeu');
        }
    }

    resetGamePlayingState(userId: string) {
        this.games.forEach(game => {
            if (game.isPlaying) {
                game.isPlaying = false;
                liveUsers.updateUserActivity(userId, undefined);
            }
        });
    }

    has(gameSlug: string) {
        return this.games.some(game => game.folderSlug === gameSlug);
    }

    resetSelected() {
        this.games.forEach(game => game.isSelected = false);
    }

    clearSearch = () => {
        global.gamesSearchQuery = '';
        this.search();
    }

    search = () => {
        const searchQuery = global.gamesSearchQuery.toLowerCase();
        if (!searchQuery || searchQuery === '') {
            this.games = this.allGames;
            return;
        }

        this.games = this.allGames.filter(game => game.title!.toLowerCase().includes(searchQuery));
    }


    installGame = async (game: InstallableGame) => {
        if (!game.isInstalled) {
            try {
                game.isInstalling = true;
                var result = await getLocalApi().install({
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
    }

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
    }

    installGames = async (games: InstallableGame[]) => {
        if (games.length === 0) {
            toast.error("Aucun jeu sélectionné");
            return;
        }
        if (this.gamesLoading) {
            toast.error("Jeux déjà en cours de chargement");
            return;
        }

        this.gamesLoading = true;
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

            if (successCount > 0) toast.success(`L'installation de ${successCount} jeu(x) a été ajoutée à la file d'attente`);
            else toast.error("Aucun jeu n'a pu être installé");
        } finally {
            this.gamesLoading = false;
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
    }

    uninstallGames = async (games: InstallableGame[]) => {
        if (games.length === 0) {
            toast.error("Aucun jeu sélectionné");
            return;
        }
        if (this.gamesLoading) {
            toast.error("Jeux déjà en cours de chargement");
            return;
        }

        this.gamesLoading = true;
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
            this.gamesLoading = false;
        }
    };



    getAvailableGames = async () => {
        if (this.gamesLoading) {
            console.warn("Games are already loading");
            return false;
        }

        this.gamesLoading = true;
        let games: InstallableGame[] = [];
        let installedGames: InstallableGame[] = [];
        const serverApi = getServerApi();
        const localApi = getLocalApi();

        try {
            // Get games from the server
            games = await serverApi.getAvailableGames({
                sort: global.gamesSortOrder,
            });
        } catch (error) {
            console.error(error);
            toast.error("Impossible de récupérer les jeux disponibles. Veuillez vérifier la connexion au serveur");
            return false;
        } finally {
            this.gamesLoading = false;
        }

        try {
            // Get installed games locally
            installedGames = await localApi.getInstalledGames();
        } catch (error) {
            console.error(error);
            toast.error("Impossible de récupérer les jeux installés. Veuillez vérifier l'agent");
            installedGames = [];
        } finally {
            this.gamesLoading = false;
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
            this.gamesLoading = false;
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
            GamesStore.gamesLoading = false;
            this.gamesLoading = false;
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
            this.games = this.games.filter(game => game.folderSlug !== gameSlug);
            toast.success("Jeu supprimé avec succès");
        } catch (error) {
            toast.error("Erreur lors de la suppression du jeu");
            console.error(error);
        }
    }


    resetGamesPlayingStates = () => {
        this.games.forEach(game => {
            if (game.isPlaying) {
                game.isPlaying = false;
            }
        });
    }


}

export const GamesStore = new GameStore();