<script lang="ts">
    import type { PageData } from "./$types";
    import { onMount } from "svelte";
    import { Button } from "$lib/components/ui/button"; // Removed type ButtonEvents
    import {
        Table,
        TableBody,
        TableCaption,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/components/ui/table";
    import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "$lib/components/ui/card";
    import { Separator } from "$lib/components/ui/separator";

    // Type definitions
    interface Team {
        nom_equipe: string;
        chef_equipe: string;
        joueurs: string;
        points: number;
        members_list?: string[];
    }

    interface Phase {
        phase_id: number | string;
        mode: string;
        map_name: string;
    }

    interface Match {
        match_id: number | string;
        faction: string;
        team_1: string;
        team_2: string;
        winner: string | null;
    }

    let { data: pageData }: { data: PageData } = $props();

    // State
    let teams = $state<Team[]>([]);
    let phases = $state<Phase[]>([]);
    let currentPhaseIndex = $state(0);
    let matchesForCurrentPhase = $state<Match[]>([]);

    let isLoadingTeams = $state(true);
    let isLoadingPhases = $state(true);
    let isLoadingMatches = $state(false);
    let errorMessages = $state<{ teams?: string; phases?: string; matches?: string; recalculate?: string }>({});

    // Colors
    const teamColors: Record<string, string> = {
        A: "#007bff",
        B: "#28a745",
        C: "#ffc107",
        D: "#dc3545",
        E: "#6f42c1",
        F: "#17a2b8",
        default: "#6c757d",
    };

    function getTeamColor(teamName: string | null): string {
        if (!teamName) return teamColors["default"];
        const upperTeamName = teamName.toUpperCase();
        return teamColors[upperTeamName] || teamColors["default"];
    }

    function getContrastingTextColor(backgroundColorHex: string): string {
        try {
            if (!backgroundColorHex || !backgroundColorHex.startsWith("#") || backgroundColorHex.length < 7) {
                return "white"; // Default for invalid hex
            }
            const r = parseInt(backgroundColorHex.slice(1, 3), 16);
            const g = parseInt(backgroundColorHex.slice(3, 5), 16);
            const b = parseInt(backgroundColorHex.slice(5, 7), 16);
            if (isNaN(r) || isNaN(g) || isNaN(b)) return "white"; // Default if parsing fails
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            return luminance > 0.5 ? "black" : "white";
        } catch (e) {
            return "white"; // Default on any error
        }
    }

    // Data Loading Functions
    async function loadTeams(): Promise<void> {
        isLoadingTeams = true;
        errorMessages.teams = undefined;
        try {
            const response = await fetch("/api/teams.php"); // Assuming API is at this path
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const rawTeams: Team[] = await response.json();
            teams = rawTeams.map((team) => ({
                ...team,
                members_list: team.joueurs.split(", ").filter((player) => player !== team.chef_equipe),
            }));
        } catch (error) {
            console.error("Erreur chargement équipes:", error);
            errorMessages.teams = `Erreur chargement équipes: ${error instanceof Error ? error.message : String(error)}`;
            teams = [];
        } finally {
            isLoadingTeams = false;
        }
    }

    async function recalculatePoints(): Promise<void> {
        errorMessages.recalculate = undefined;
        try {
            const response = await fetch("/api/matches.php?recalculate_points", { method: "POST" });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            if (result.success) {
                console.log(result.message);
                await loadTeams();
            } else {
                console.error(result.message);
                errorMessages.recalculate = result.message || "Erreur recalcul des points.";
            }
        } catch (error) {
            console.error("Erreur recalcul points:", error);
            errorMessages.recalculate = `Erreur recalcul points: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    async function loadPhases(): Promise<void> {
        isLoadingPhases = true;
        errorMessages.phases = undefined;
        try {
            const response = await fetch("/api/phases.php");
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const fetchedPhases: Phase[] = await response.json();
            phases = fetchedPhases.filter(
                (phase, index, self) => index === self.findIndex((p) => p.phase_id === phase.phase_id),
            );
            if (phases.length > 0) {
                currentPhaseIndex = 0;
            }
        } catch (error) {
            console.error("Erreur chargement phases:", error);
            errorMessages.phases = `Erreur chargement phases: ${error instanceof Error ? error.message : String(error)}`;
            phases = [];
        } finally {
            isLoadingPhases = false;
        }
    }

    async function loadMatchesForPhase(phaseId: number | string | undefined): Promise<void> {
        if (!phaseId) {
            matchesForCurrentPhase = [];
            return;
        }
        isLoadingMatches = true;
        errorMessages.matches = undefined;
        try {
            const response = await fetch(`/api/matches.php?phase_id=${phaseId}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            matchesForCurrentPhase = await response.json();
        } catch (error) {
            console.error(`Erreur chargement matchs phase ${phaseId}:`, error);
            errorMessages.matches = `Erreur chargement matches: ${error instanceof Error ? error.message : String(error)}`;
            matchesForCurrentPhase = [];
        } finally {
            isLoadingMatches = false;
        }
    }

    // Derived State & Effects
    let currentPhase = $derived(phases[currentPhaseIndex]);

    $effect(() => {
        // This effect will run whenever currentPhase changes.
        // currentPhase changes when currentPhaseIndex or phases array changes.
        loadMatchesForPhase(currentPhase?.phase_id);
    });

    let isPrevDisabled = $derived(currentPhaseIndex <= 0);
    let isNextDisabled = $derived(currentPhaseIndex >= phases.length - 1 || phases.length === 0);

    // Navigation Handlers
    function handlePrevPhaseClick(): void {
        // Removed event parameter
        if (!isPrevDisabled) currentPhaseIndex--;
    }

    function handleRecalculatePointsClick(): void {
        // Removed event parameter
        recalculatePoints();
    }

    function handleNextPhaseClick(): void {
        // Removed event parameter
        if (!isNextDisabled) currentPhaseIndex++;
    }

    // Image error handler
    function handleImageError(event: Event): void {
        const img = event.currentTarget as HTMLImageElement;
        img.style.display = "none";
        const nextEl = img.nextElementSibling as HTMLElement | null;
        if (nextEl) {
            nextEl.style.display = "flex";
        }
    }

    // Lifecycle
    onMount(async () => {
        await loadTeams();
        await loadPhases();
    });
</script>

<div class="container mx-auto space-y-8 p-4 md:p-8">
    <section aria-labelledby="teams-heading">
        <h2 id="teams-heading" class="mb-6 text-center text-3xl font-bold sm:text-left">Classement des Équipes</h2>
        {#if isLoadingTeams}
            <p class="text-center text-muted-foreground">Chargement des équipes...</p>
        {:else if errorMessages.teams}
            <p class="text-center text-red-500">{errorMessages.teams}</p>
        {:else if teams.length === 0}
            <p class="text-center text-muted-foreground">Aucune équipe à afficher.</p>
        {:else}
            <Card>
                <CardContent class="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead class="text-center">Nom Équipe</TableHead>
                                <TableHead class="text-center">Chef d'Équipe</TableHead>
                                <TableHead class="text-center">Membres</TableHead>
                                <TableHead class="text-center">Points</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {#each teams as team (team.nom_equipe)}
                                {@const bgColor = getTeamColor(team.nom_equipe)}
                                {@const textColor = getContrastingTextColor(bgColor)}
                                <TableRow style="background-color: {bgColor}; color: {textColor}; text-align: center;">
                                    <TableCell class="font-semibold">{team.nom_equipe}</TableCell>
                                    <TableCell class="font-semibold">{team.chef_equipe}</TableCell>
                                    <TableCell>{team.members_list?.join(" | ") || "Aucun membre"}</TableCell>
                                    <TableCell>{team.points || 0}</TableCell>
                                </TableRow>
                            {/each}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        {/if}
    </section>

    <Separator />

    <section aria-labelledby="phases-heading">
        <h2 id="phases-heading" class="mb-6 text-center text-3xl font-bold sm:text-left">Phases du Tournoi</h2>
        {#if isLoadingPhases}
            <p class="text-center text-muted-foreground">Chargement des phases...</p>
        {:else if errorMessages.phases}
            <p class="text-center text-red-500">{errorMessages.phases}</p>
        {:else if phases.length === 0}
            <p class="text-center text-muted-foreground">Aucune phase de tournoi disponible.</p>
        {:else}
            <div class="mb-6 flex flex-col items-center justify-center space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
                <Button onclick={handlePrevPhaseClick} disabled={isPrevDisabled} class="w-full sm:w-auto">
                    Phase Précédente
                </Button>
                <Button onclick={handleRecalculatePointsClick} variant="secondary" class="w-full sm:w-auto">
                    Recalculer les Points
                </Button>
                <Button onclick={handleNextPhaseClick} disabled={isNextDisabled} class="w-full sm:w-auto">
                    Phase Suivante
                </Button>
            </div>
            {#if errorMessages.recalculate}
                <p class="mb-4 text-center text-red-500">{errorMessages.recalculate}</p>
            {/if}

            {#if currentPhase}
                <Card class="w-full">
                    <CardHeader>
                        <CardTitle class="text-center text-xl md:text-2xl">
                            Phase {currentPhase.phase_id} - {currentPhase.mode} ({currentPhase.map_name})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {#if isLoadingMatches}
                            <p class="text-center text-muted-foreground">Chargement des matchs...</p>
                        {:else if errorMessages.matches}
                            <p class="text-center text-red-500">{errorMessages.matches}</p>
                        {:else if matchesForCurrentPhase.length === 0}
                            <p class="text-center text-muted-foreground">Aucun match pour cette phase.</p>
                        {:else}
                            <div class="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead class="text-center">Match ID</TableHead>
                                            <TableHead class="text-center">Serveur</TableHead>
                                            <TableHead class="text-center">Équipe 1</TableHead>
                                            <TableHead class="text-center">Équipe 2</TableHead>
                                            <TableHead class="text-center">Vainqueur</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {#each matchesForCurrentPhase as match (match.match_id)}
                                            {@const team1Color = getTeamColor(match.team_1)}
                                            {@const team1TextColor = getContrastingTextColor(team1Color)}
                                            {@const team2Color = getTeamColor(match.team_2)}
                                            {@const team2TextColor = getContrastingTextColor(team2Color)}
                                            {@const winnerColor = getTeamColor(match.winner)}
                                            {@const winnerTextColor = getContrastingTextColor(winnerColor)}
                                            {@const matchIdBgColor = "#5d6d7e"}
                                            {@const matchIdTextColor = getContrastingTextColor(matchIdBgColor)}
                                            {@const serverBgColor = "#99a3a4"}
                                            {@const serverTextColor = getContrastingTextColor(serverBgColor)}
                                            <TableRow style="text-align: center;">
                                                <TableCell
                                                    style="background-color: {matchIdBgColor}; color: {matchIdTextColor}; font-weight: bold;">
                                                    {match.match_id}
                                                </TableCell>
                                                <TableCell
                                                    style="background-color: {serverBgColor}; color: {serverTextColor}; font-weight: bold;">
                                                    {match.faction}
                                                </TableCell>
                                                <TableCell
                                                    style="background-color: {team1Color}; color: {team1TextColor}; font-weight: bold;">
                                                    {match.team_1}
                                                </TableCell>
                                                <TableCell
                                                    style="background-color: {team2Color}; color: {team2TextColor}; font-weight: bold;">
                                                    {match.team_2}
                                                </TableCell>
                                                <TableCell
                                                    style="background-color: {winnerColor}; color: {winnerTextColor}; font-weight: bold;">
                                                    {match.winner || "En attente"}
                                                </TableCell>
                                            </TableRow>
                                        {/each}
                                    </TableBody>
                                </Table>
                            </div>
                        {/if}

                        <div class="mt-6 grid grid-cols-1 items-start gap-4 md:grid-cols-2">
                            <div>
                                <h3 class="mb-2 text-center text-lg font-semibold">Carte de la Phase</h3>
                                <img
                                    src={`/map/map_phase${currentPhase.phase_id}.jpg`}
                                    alt={`Map de la phase ${currentPhase.phase_id}`}
                                    class="h-64 w-full rounded-md border object-contain md:h-80"
                                    onerror={handleImageError} />
                                <div
                                    style="display:none;"
                                    class="flex h-64 w-full items-center justify-center rounded-md border bg-muted text-muted-foreground md:h-80">
                                    Image de la carte non disponible.
                                </div>
                            </div>
                            <div>
                                <h3 class="mb-2 text-center text-lg font-semibold">Minicarte</h3>
                                <img
                                    src={`/map/minimap_phase${currentPhase.phase_id}.jpg`}
                                    alt={`Minicarte de la phase ${currentPhase.phase_id}`}
                                    class="h-64 w-full rounded-md border object-contain md:h-80"
                                    onerror={handleImageError} />
                                <div
                                    style="display:none;"
                                    class="flex h-64 w-full items-center justify-center rounded-md border bg-muted text-muted-foreground md:h-80">
                                    Minicarte non disponible.
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            {:else if !isLoadingPhases && phases.length > 0}
                <p class="text-center text-muted-foreground">Phase en cours de chargement ou non sélectionnée.</p>
            {/if}
        {/if}
    </section>
</div>
