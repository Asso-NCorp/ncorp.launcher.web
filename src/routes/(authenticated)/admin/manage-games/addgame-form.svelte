<script lang="ts">
    import * as Alert from "$lib/components/ui/alert";
    import { toast } from "svelte-sonner";
    import SuperDebug, { type SuperValidated, type Infer, superForm } from "sveltekit-superforms";
    import { zodClient } from "sveltekit-superforms/adapters";
    import { goto } from "$app/navigation";
    import { CircleAlert } from "@lucide/svelte";
    import { addGameFormSchema, type AddGameFormSchema } from "./schemas";
    import { page } from "$app/state";
    import { browser } from "$app/environment";
    import type { Game, InstallableGame } from "$lib/shared-models";
    import * as Form from "$lib/components/ui/form/index.js";

    // Import our custom components
    import GameSearch from "$lib/components/game/GameSearch.svelte";
    import CoverImageUpload from "$lib/components/game/CoverImageUpload.svelte";
    import ScreenshotsUpload from "$lib/components/game/ScreenshotsUpload.svelte";
    import GenresSelection from "$lib/components/game/GenresSelection.svelte";
    import GameDetailsForm from "$src/lib/components/game/GameDetailsForm.svelte";
    import GamesList from "./games-list.svelte";
    import { GamesStore } from "$src/lib/states/games.svelte";
    import Loader from "$src/lib/components/custom/Loader.svelte";
    import GameModesSelection from "$src/lib/components/game/GameModesSelection.svelte";
    import { onMount } from "svelte";
    import LogoImageUpload from "$lib/components/game/LogoImageUpload.svelte";
    import { getServerApi } from "$src/lib/utils";
    import { logger } from "$src/lib/stores/loggerStore";

    // Provide available logos (adjust data source as needed)
    let logos = $state<string[]>([]);
    const folders = page.data["folders"] as string[];
    let { data }: { data: { form: SuperValidated<Infer<AddGameFormSchema>> } } = $props();

    const form = superForm(data.form, {
        dataType: "json",
        validators: zodClient(addGameFormSchema),
        onResult: async (result) => {
            if (result.result.type === "success") {
                toast.success("Jeu ajouté avec succès", { class: "bg-green-500" });
                $formData.cover = {};
                $formData.logo = {};
                $formData.screenshots = {};
                logos = [];
                await GamesStore.getAvailableGames();
            } else if (result.result.type === "redirect") {
                goto(result.result.location);
            } else if (result.result.type === "error") {
                toast.error("Erreur lors de l'ajout du jeu : " + result.result.error);
            }
        },
        onError: (event) => {
            toast.error("Erreur lors de l'ajout du jeu");
            console.error("Form submission error:", event);
        },
    });

    const { form: formData, enhance, allErrors, submitting } = form;

    function fmtDate(d: Date) {
        return d.toISOString().slice(0, 10);
    }
    function clearTemporalFields() {
        $formData.dateAdded = null as any;
        $formData.dateUpdated = null as any;
    }

    // Handle game selection from search
    async function handleGameSelect(game: Game) {
        clearTemporalFields();
        // Populate form fields with game data
        $formData.title = game.name || "";
        $formData.description = game.summary || "";

        // Set logo if available

        if (game.name) {
            logos = await getServerApi().searchLogos({ gameName: game.name });
        }

        // Set max players if available
        if (game.gameModes?.values?.length) {
            // Try to determine max players from game modes
            const multiplayerMode = game.gameModes.values.find((mode) =>
                mode.name?.toLowerCase().includes("multiplayer"),
            );
            if (multiplayerMode) {
                $formData.maxPlayers = 4; // Default to 4 for multiplayer games
            } else {
                $formData.maxPlayers = 1; // Default to 1 for single player games
            }
        } else {
            $formData.maxPlayers = 1; // Default to 1 if no game modes
        }

        // Set genres if available
        if (game.genres?.values?.length) {
            $formData.genres = game.genres.values.map((genre) => genre.name || "").filter((name) => name !== "");
        }

        // Set cover image if available
        if (game.cover?.value?.imageId) {
            // Use the image ID as the filename with .jpg extension
            const imageId = game.cover.value.imageId;
            const imageUrl = `https://images.igdb.com/igdb/image/upload/t_1080p/${imageId}.jpg`;

            // Fetch the image and convert to base64
            fetch(imageUrl)
                .then((response) => response.blob())
                .then((blob) => {
                    return new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            resolve(reader.result as string);
                        };
                        reader.readAsDataURL(blob);
                    });
                })
                .then((coverBase64) => {
                    // Set cover as dictionary with filename as key and base64 as value
                    $formData.cover = { [`${imageId}.jpg`]: coverBase64 };
                })
                .catch((error) => {
                    console.error("Error fetching cover image:", error);
                    // Fallback to just using the URL if fetch fails
                    $formData.cover = { [`${imageId}.jpg`]: imageUrl };
                });
        }

        // Set screenshots if available
        if (game.screenshots?.values?.length) {
            // Process screenshots to convert URLs to base64

            // Process each screenshot: fetch the image and convert to base64
            const screenshotPromises = game.screenshots.values.map(async (sc) => {
                const imageId = sc.imageId;
                const imageUrl = `https://images.igdb.com/igdb/image/upload/t_1080p/${imageId}.jpg`;
                const fileName = `${imageId}.jpg`;

                try {
                    // Fetch the image and convert to base64
                    const response = await fetch(imageUrl);
                    const blob = await response.blob();
                    return new Promise<{ key: string; value: string }>((resolve) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            resolve({
                                key: fileName,
                                value: reader.result as string,
                            });
                        };
                        reader.readAsDataURL(blob);
                    });
                } catch (error) {
                    console.error(`Error fetching screenshot ${imageId}:`, error);
                    // Fallback to using the URL if fetch fails
                    return {
                        key: fileName,
                        value: imageUrl,
                    };
                }
            });

            // Wait for all screenshots to be processed
            Promise.all(screenshotPromises).then((screenshotArray) => {
                // Convert array of {key, value} to {[key]: value} format
                const screenshotsDict: { [key: string]: string } = {};
                screenshotArray.forEach((item) => {
                    screenshotsDict[item.key] = item.value;
                });

                // Update form data
                $formData.screenshots = screenshotsDict;
            });
        }

        // Trigger form validation
        form.validateForm({
            update: true,
        });
    }

    const handleInstallableGameSelect = async (game: InstallableGame) => {
        clearTemporalFields();
        // Populate basic game information
        $formData.title = game.title || "";
        $formData.folderSlug = game.folderSlug || "";
        $formData.description = game.description || "";
        $formData.startCommand = game.startCommand || "";
        $formData.mainProcessName = game.mainProcessName || "";
        $formData.sizeGb = game.sizeGb || 1;
        $formData.maxPlayers = game.maxPlayers || 1;
        $formData.genres = game.genres || [];
        $formData.useNotifications = game.useNotifications || true;
        $formData.isFeatured = game.isFeatured || false;
        // UPDATED: only set if provided, otherwise keep cleared (null)
        $formData.dateAdded = game.dateAdded ? fmtDate(new Date(game.dateAdded)) : null;
        $formData.dateUpdated = game.dateUpdated ? fmtDate(new Date(game.dateUpdated)) : null;

        // Normalize and restrict game modes to the allowed literal types
        {
            const allowed = new Set(["SOLO", "COOP", "MULTI"]);
            $formData.gameModes = (game.gameModes || [])
                .map((m) => String(m).toUpperCase())
                .filter((m) => allowed.has(m)) as ("SOLO" | "COOP" | "MULTI")[];
        }

        logos = await getServerApi().searchLogos({ gameName: game.title || "" });

        // Handle cover image
        if (game.cover) {
            try {
                // Fetch the cover image
                const coverUrl = `/api/resources/${game.cover}`;
                const coverResponse = await fetch(coverUrl);
                const coverBlob = await coverResponse.blob();

                // Convert to base64
                const coverBase64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.readAsDataURL(coverBlob);
                });

                // Generate a filename or use the existing one
                const coverFileName = game.cover.includes("/")
                    ? game.cover.split("/").pop() || `cover_${Date.now()}.jpg`
                    : game.cover;

                // Set the cover in the form data
                $formData.cover = { [coverFileName]: coverBase64 };
            } catch (error) {
                console.error("Error fetching cover image:", error);
                // Fallback to using the URL directly
                const coverFileName = game.cover.includes("/")
                    ? game.cover.split("/").pop() || `cover_${Date.now()}.jpg`
                    : game.cover;
                $formData.cover = { [coverFileName]: `/api/resources/${game.cover}` };
            }
        } else {
            // Clear cover if none exists
            $formData.cover = {};
        }

        // Handle logo image
        if (game.logo) {
            try {
                // Fetch the logo image
                const logoUrl = `/api/resources/${game.logo}`;
                const logoResponse = await fetch(logoUrl);
                const logoBlob = await logoResponse.blob();

                // Convert to base64
                const logoBase64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.readAsDataURL(logoBlob);
                });

                // Generate a filename or use the existing one
                const logoFileName = game.logo.includes("/")
                    ? game.logo.split("/").pop() || `logo_${Date.now()}.jpg`
                    : game.logo;

                // Set the logo in the form data
                $formData.logo = { [logoFileName]: logoBase64 };
            } catch (error) {
                console.error("Error fetching logo image:", error);
                // Fallback to using the URL directly
                const logoFileName = game.logo.includes("/")
                    ? game.logo.split("/").pop() || `logo_${Date.now()}.jpg`
                    : game.logo;
                $formData.logo = { [logoFileName]: `/api/resources/${game.logo}` };
            }
        } else {
            // Clear logo if none exists
            $formData.logo = {};
        }

        // Handle screenshots
        if (game.screenshots && game.screenshots.length > 0) {
            try {
                // Process each screenshot
                const screenshotPromises = game.screenshots.map(async (screenshot) => {
                    const screenshotUrl = `/api/resources/${screenshot}`;

                    try {
                        // Fetch the screenshot
                        const response = await fetch(screenshotUrl);
                        const blob = await response.blob();

                        // Convert to base64
                        const base64Data = await new Promise<string>((resolve) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result as string);
                            reader.readAsDataURL(blob);
                        });

                        // Generate a filename or use the existing one
                        const fileName = screenshot.includes("/")
                            ? screenshot.split("/").pop() || `screenshot_${Date.now()}.jpg`
                            : screenshot;

                        return { key: fileName, value: base64Data };
                    } catch (error) {
                        console.error(`Error fetching screenshot ${screenshot}:`, error);
                        // Fallback to using the URL directly
                        const fileName = screenshot.includes("/")
                            ? screenshot.split("/").pop() || `screenshot_${Date.now()}.jpg`
                            : screenshot;
                        return { key: fileName, value: screenshotUrl };
                    }
                });

                // Wait for all screenshots to be processed
                const screenshotArray = await Promise.all(screenshotPromises);

                // Convert array of {key, value} to {[key]: value} format
                const screenshotsDict: { [key: string]: string } = {};
                screenshotArray.forEach((item) => {
                    screenshotsDict[item.key] = item.value;
                });

                // Update form data
                $formData.screenshots = screenshotsDict;
            } catch (error) {
                console.error("Error processing screenshots:", error);
                // Clear screenshots on error
                $formData.screenshots = {};
            }
        } else {
            // Clear screenshots if none exist
            $formData.screenshots = {};
        }

        // Validate the form
        form.validateForm({
            update: true,
        });
    };

    // Remove dynamic left column height logic

    function handleReset(event: Event) {
        event.preventDefault();
        // Reset form via superforms (if available)
        if (typeof form.reset === "function") form.reset();
        // Explicitly clear media-related stores
        $formData.cover = {};
        $formData.logo = {};
        $formData.screenshots = {};
        // Optionally clear other derived arrays if desired
        // $formData.genres = [];
        // $formData.gameModes = [];
        clearTemporalFields();
    }
</script>

<div class="grid grid-cols-3 gap-8">
    <div class="sticky flex flex-col" style="height:calc(100vh - var(--header-height) - 2rem);">
        <div class="min-h-0 flex-1 overflow-y-auto pr-2">
            <GamesList gameSelected={handleInstallableGameSelect} />
        </div>
    </div>

    <form method="POST" class="flex flex-col gap-4" use:enhance>
        {#if $allErrors.length > 0}
            <Alert.Root variant="destructive">
                <CircleAlert class="size-4" />
                <Alert.Title>Erreur{$allErrors.length > 0 && "s"}</Alert.Title>
                <Alert.Description>
                    <ul>
                        {#each $allErrors as error}
                            <li>{error.messages.join(". ")}</li>
                        {/each}
                    </ul>
                </Alert.Description>
            </Alert.Root>
        {/if}

        <!-- Game Search Component -->
        <GameSearch {form} bind:title={$formData.title} onGameSelect={handleGameSelect} />

        <!-- Game Details Form -->
        <GameDetailsForm {form} {folders} {formData} />

        <!-- Genres Selection -->
        <GenresSelection {form} genres={$formData.genres || []} onChange={(genres) => ($formData.genres = genres)} />

        <!-- Game Modes Selection -->
        <GameModesSelection
            {form}
            gameModes={$formData.gameModes || []}
            onChange={(gameModes) => ($formData.gameModes = gameModes)} />

        <Form.Button disabled={$submitting || $allErrors.length > 0}>
            {#if $submitting}
                <Loader size={24} />
            {:else}
                Valider
            {/if}
        </Form.Button>

        <Form.Button variant="secondary" type="button" onclick={handleReset} disabled={$submitting}>
            Annuler
        </Form.Button>

        <!-- {#if browser && import.meta.env.DEV}
            <SuperDebug data={$formData} />
        {/if} -->
    </form>

    <!-- Right column now sticky -->

    <div class="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
        <!-- Replaced CoverImageUpload (Logo) with LogoImageUpload -->
        <LogoImageUpload
            logo={$formData.logo || {}}
            {logos}
            heightClass="h-60"
            title="Logo"
            description="Uploader ou choisir un logo"
            onChange={(logo) => {
                $formData.logo = logo || {};
            }} />

        <CoverImageUpload
            title="Couverture"
            heightClass="h-40"
            description="Sélectionner ou uploader une image de couverture"
            cover={$formData.cover || {}}
            onChange={(cover) => {
                $formData.cover = cover || {};
            }} />

        <ScreenshotsUpload
            screenshots={$formData.screenshots || {}}
            onChange={(screenshots) => {
                $formData.screenshots = screenshots;
            }} />
    </div>
</div>
