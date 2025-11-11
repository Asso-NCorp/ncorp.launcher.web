import { toast } from "svelte-sonner";
import { FetchError } from "../shared-models";
import type { InstallableGameExtended } from "../types";
import { global } from "../states/global.svelte";
import { liveUsers } from "../states/live-users.svelte";
import { getLocalApi, getServerApi, syncArrayInPlace } from "../utils";
import { liveAgentConnection } from "../states/live-agent.svelte";
import { extendGames } from "../utils/games";

class GameStore {
    games: InstallableGameExtended[] = $state([]);
    selected: InstallableGameExtended[] = $derived(this.games.filter((g) => g.isSelected));
    isLoading = $state(false);
    installedGames: InstallableGameExtended[] = $derived(this.games.filter((g) => g.isInstalled));
    recentlyAddedGames: InstallableGameExtended[] = $derived(this.getAllRecentlyAddedGames());
    allGames: InstallableGameExtended[] = $state([]);

    lastGameFetchAt: number = $state(0); // ms epoch (info)
    private inFlight?: Promise<boolean>;
    private COOLDOWN_MS = 10_000;
    private cooldownTimer: ReturnType<typeof setTimeout> | null = null;
    private tickTimer: ReturnType<typeof setInterval> | null = null;

    private cooldownActive = $state(false);
    private cooldownEndAt: number = $state(0);

    canFetchGames = $derived(!this.isLoading && !this.cooldownActive);

    // Compte à rebours en secondes, mis à jour automatiquement
    cooldownRemaining = $state(0);

    // --- utils cooldown ---
    private startCooldown(ms = this.COOLDOWN_MS) {
        this.cooldownActive = true;
        this.cooldownEndAt = Date.now() + ms;
        this.updateRemaining(); // init immédiate

        // clear timers
        if (this.cooldownTimer) clearTimeout(this.cooldownTimer);
        if (this.tickTimer) clearInterval(this.tickTimer);

        // timer principal (fin du cooldown)
        this.cooldownTimer = setTimeout(() => {
            this.cooldownActive = false;
            this.cooldownEndAt = 0;
            this.cooldownRemaining = 0;
            if (this.tickTimer) {
                clearInterval(this.tickTimer);
                this.tickTimer = null;
            }
            this.cooldownTimer = null;
        }, ms);

        // timer secondaire (mise à jour chaque seconde)
        this.tickTimer = setInterval(() => {
            this.updateRemaining();
        }, 1000);
    }

    private updateRemaining() {
        if (!this.cooldownActive) {
            this.cooldownRemaining = 0;
            return;
        }
        const diff = this.cooldownEndAt - Date.now();
        this.cooldownRemaining = diff > 0 ? Math.ceil(diff / 1000) : 0;
    }

    dispose() {
        if (this.cooldownTimer) clearTimeout(this.cooldownTimer);
        if (this.tickTimer) clearInterval(this.tickTimer);
        this.cooldownTimer = null;
        this.tickTimer = null;
    }

    setGames(games: InstallableGameExtended[]) {
        syncArrayInPlace(this.allGames, games, (g) => g.folderSlug);
        syncArrayInPlace(this.games, games, (g) => g.folderSlug);
    }

    setGameETA(gameSlug: string, eta?: string) {
        const game = this.get(gameSlug);
        if (game) {
            game.eta = eta;
        }
    }

    setGameStatus(gameSlug: string, status?: string) {
        const game = this.get(gameSlug);
        if (game) {
            game.status = status;
        }
    }

    get(slug: string): InstallableGameExtended | undefined {
        return this.allGames.find((g) => g.folderSlug === slug);
    }

    select(game: InstallableGameExtended) {
        game.isSelected = true;
    }
    deselect(slug: string) {
        const g = this.get(slug);
        if (g) g.isSelected = false;
    }
    toggleSelect(slug: string, checked: boolean) {
        const g = this.get(slug);
        if (g) g.isSelected = checked;
    }

    async syncPlayingGames() {
        await getLocalApi().syncPlayingGames();
    }

    setGameInstallProgress(slug: string, p: number) {
        const g = this.get(slug);
        if (g) g.installProgress = p;
    }

    setGameIsInstalled(slug: string, isInstalled: boolean) {
        const g = this.get(slug);
        if (!g) return;
        g.isInstalled = isInstalled;
        g.isInstalling = false;
        g.installProgress = isInstalled ? 100 : 0;
        g.isLoading = !isInstalled;
    }

    setGameIsInstalling(slug: string, isInstalling: boolean) {
        // Set all other games to not installing
        this.games.forEach((g) => {
            if (g.folderSlug !== slug) g.isInstalling = false;
        });
        const g = this.get(slug);
        if (g) {
            g.isInstalling = isInstalling;
        }
    }

    getGameCover = (slug: string): string => {
        const g = this.get(slug);
        return g?.cover ? `/api/resources/${g.cover}` : "/img/not_found.webp";
    };

    getGameScreenshot = (slug: string): string => {
        const g = this.get(slug);
        const shots = g?.screenshots ?? [];
        return shots.length > 0 ? `/api/resources/${shots[0]}` : "/img/not_found.webp";
    };

    setGamePlayingState(userId: string, slug: string, isPlaying: boolean) {
        const g = this.get(slug);
        if (g) {
            if (userId === global.currentUser?.id) g.isPlaying = isPlaying;
            liveUsers.updateUserActivity(userId, isPlaying ? `Joue à ${g.title}` : undefined);
        } else {
            console.error(`Game with folder slug ${slug} not found`);
            liveUsers.updateUserActivity(userId, "Joue à un jeu");
        }
    }

    resetGamePlayingState(userId: string) {
        this.games.forEach((g) => {
            if (g.isPlaying) {
                g.isPlaying = false;
                liveUsers.updateUserActivity(userId, undefined);
            }
        });
    }

    has(slug: string) {
        return this.games.some((g) => g.folderSlug === slug);
    }

    resetSelected() {
        this.games.forEach((g) => (g.isSelected = false));
    }

    getAllRecentlyAddedGames(): InstallableGameExtended[] {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return this.allGames.filter((g) => {
            if (!g.dateAdded) return false;
            const gameDate = new Date(g.dateAdded);
            return gameDate > thirtyDaysAgo;
        });
    }

    clearSearch = () => {
        global.gamesSearchQuery = "";
        this.search(global.gamesSearchQuery, ["SOLO", "COOP", "MULTI"]);
    };

    search = (
        searchQuery: string = global.gamesSearchQuery,
        modesSelected: string[] = ["SOLO", "COOP", "MULTI"],
        genresSelected: string[] = [],
    ) => {
        const query = (searchQuery ?? "").toLowerCase();
        if (!Array.isArray(modesSelected)) modesSelected = [];
        if (modesSelected.length === 0) {
            this.games = [];
            return;
        }

        const allModesChecked = modesSelected.length === 3;

        this.games = this.allGames.filter((g) => {
            const titleMatch = !query || g.title?.toLowerCase().includes(query);

            // Genre filter: if genres are selected, at least one must match
            if (genresSelected.length > 0) {
                const gameGenres = g.genres ?? [];
                const hasMatchingGenre = gameGenres.some((genre) =>
                    genresSelected.some((selected) => selected.toLowerCase() === genre.toLowerCase()),
                );
                if (!hasMatchingGenre) return false;
            }

            if (allModesChecked) return titleMatch;
            const gameModes = g.gameModes ?? [];
            if (gameModes.length === 0) return false;
            return titleMatch && gameModes.some((m) => modesSelected.includes(m));
        });
    };

    installGame = async (game: InstallableGameExtended, reinstall?: boolean) => {
        if (game.isInstalled && !reinstall) return;
        try {
            game.isInstalling = true;
            const result = await getLocalApi().install({ installableGame: game });
            if (!result.isSuccess) toast.error(result.message!);
        } catch (error) {
            if (error instanceof FetchError && error.cause && error.cause.name === "TypeError") {
                console.log("Erreur de réseau:", error.cause);
            } else {
                console.error(error);
                game.installError = (error as Error)?.message;
            }
            toast.error("Erreur lors de l'installation", { class: "bg-red-500" });
            game.isInstalling = false;
            game.isInstalled = false;
        }
    };

    cancelGameInstallation = async (game: InstallableGameExtended) => {
        try {
            game.isCancellingInstall = true;
            await getLocalApi().cancelInstallation({ gameSlug: game.folderSlug });
            toast.success("Annulation réussie", { class: "bg-green-500" });
            this.setGameIsInstalled(game.folderSlug!, false);
            this.deselect(game.folderSlug!);
        } catch (error) {
            console.error(error);
            game.installError = (error as Error)?.message;
            toast.error("Erreur lors de l'annulation", { class: "bg-red-500" });
        } finally {
            game.isCancellingInstall = false;
        }
    };

    installGames = async (games: InstallableGameExtended[]) => {
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
            for (const g of games) {
                try {
                    await this.installGame(g);
                    successCount++;
                } catch (err) {
                    console.error(`Erreur installation ${g.title}`, err);
                    toast.error(`Erreur sur ${g.title}`);
                }
            }
            if (successCount > 0)
                toast.success(`L'installation de ${successCount} jeu(x) a été ajoutée à la file d'attente`);
            else toast.error("Aucun jeu n'a pu être installé");
        } finally {
            this.isLoading = false;
        }
    };

    uninstallGame = async (game: InstallableGameExtended) => {
        if (!game.isInstalled) return;
        try {
            game.isLoading = true;
            await getLocalApi().deleteGame({ gameSlug: game.folderSlug });
            toast.success("Désinstallation réussie", { class: "bg-green-500" });
        } catch (error) {
            console.error(error);
            game.installError = (error as Error)?.message;
            toast.error("Erreur lors de la désinstallation", { class: "bg-red-500" });
        } finally {
            this.setGameIsInstalled(game.folderSlug!, false);
            this.deselect(game.folderSlug!);
            game.isLoading = false;
        }
    };

    uninstallGames = async (games: InstallableGameExtended[]) => {
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
            for (const g of games) {
                try {
                    g.isLoading = true;
                    await this.uninstallGame(g);
                    successCount++;
                } catch (err) {
                    console.error(`Erreur désinstallation ${g.title}`, err);
                    toast.error(`Erreur sur ${g.title}`);
                } finally {
                    this.deselect(g.folderSlug!);
                    this.setGameIsInstalled(g.folderSlug!, false);
                    g.isLoading = false;
                }
            }
            if (successCount > 0) toast.success(`${successCount} jeu(x) désinstallé(s)`);
            else toast.error("Aucun jeu n'a pu être désinstallé");
        } finally {
            this.isLoading = false;
        }
    };

    getAvailableGames = async (): Promise<boolean> => {
        // utilise la derived réactive (pas Date.now)
        if (!this.canFetchGames) {
            console.warn("Cooldown actif ou déjà en cours");
            return false;
        }

        // coalesce
        if (this.inFlight) {
            console.warn("Join in-flight request");
            return this.inFlight;
        }
        if (this.isLoading) {
            console.warn("Games are already loading");
            return false;
        }

        this.isLoading = true;
        this.inFlight = (async () => {
            let games: InstallableGameExtended[] = [];
            let installedGames: InstallableGameExtended[] = [];

            try {
                // Server games
                const serverApi = getServerApi();
                games = extendGames(await serverApi.getAvailableGames({ sort: global.gamesSortOrder }));

                // Local games (best-effort)
                try {
                    if (global.localGamesFolder) {
                        const localApi = getLocalApi();
                        installedGames = extendGames(
                            await localApi.getInstalledGames({ gamesFolder: global.localGamesFolder }),
                        );
                    }
                } catch (err) {
                    console.error(err);
                    if (liveAgentConnection.isConnected)
                        toast.error(
                            "L'agent semble lancé mais il est impossible de récupérer les jeux installés. Veuillez vérifier l'agent.",
                        );
                    installedGames = [];
                }

                // Merge
                const mergedGames = games.map((g) => ({
                    ...g,
                    isInstalled: installedGames.some((x) => x.folderSlug === g.folderSlug && x.isInstalled),
                    isPlaying: installedGames.some((x) => x.folderSlug === g.folderSlug && x.isPlaying),
                }));
                this.setGames(mergedGames);

                // Optional sync (non-bloquant)
                try {
                    if (liveAgentConnection?.isConnected && global.localGamesFolder) {
                        await this.syncPlayingGames();
                    }
                } catch (err) {
                    console.error(err);
                }

                // succès → démarre cooldown
                this.lastGameFetchAt = Date.now();
                this.startCooldown();
                return true;
            } catch (error) {
                console.error(error);
                toast.error("Impossible de récupérer les jeux disponibles. Veuillez vérifier la connexion au serveur");
                return false;
            } finally {
                this.isLoading = false;
                this.inFlight = undefined;
            }
        })();

        return this.inFlight;
    };

    async deleteGame(slug: string) {
        try {
            const deleted = await getServerApi().deleteGame({ slug });
            if (!deleted) {
                toast.error("Erreur lors de la suppression du jeu");
                return;
            }
            this.games = this.games.filter((g) => g.folderSlug !== slug);
            toast.success("Jeu supprimé avec succès");
        } catch (error) {
            toast.error("Erreur lors de la suppression du jeu");
            console.error(error);
        }
    }

    resetGamesPlayingStates = () => {
        this.games.forEach((g) => {
            if (g.isPlaying) g.isPlaying = false;
        });
    };

    uninstallAllInstalledGames = async () => {
        try {
            for (const g of this.games) if (g.isInstalled) await this.uninstallGame(g);
            toast.success("Tous les jeux installés ont été désinstallés");
        } catch (error) {
            console.error("Erreur lors de la désinstallation", error);
            toast.error("Erreur lors de la désinstallation");
        }
    };

    toggleFavorite = async (slug: string) => {
        const game = this.get(slug);
        if (!game) return;

        try {
            const response = await fetch("/api/games/favorite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    gameSlug: slug,
                    isFavorite: !game.isFavorite,
                }),
            });

            if (!response.ok) {
                toast.error("Erreur lors de la mise à jour du favori");
                return;
            }

            game.isFavorite = !game.isFavorite;
            toast.success(game.isFavorite ? "Ajouté aux favoris" : "Retiré des favoris");
        } catch (error) {
            console.error("Error toggling favorite:", error);
            toast.error("Erreur lors de la mise à jour du favori");
        }
    };

    getFavoriteGames = (): InstallableGameExtended[] => {
        return this.allGames.filter((g) => g.isFavorite);
    };
}

export const GamesStore = new GameStore();
