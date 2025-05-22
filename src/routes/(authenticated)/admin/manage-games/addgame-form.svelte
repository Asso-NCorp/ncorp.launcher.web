<script lang="ts">
    import * as Alert from "$lib/components/ui/alert";
    import { toast } from "svelte-sonner";
    import SuperDebug, { type SuperValidated, type Infer, superForm } from "sveltekit-superforms";
    import { zodClient } from "sveltekit-superforms/adapters";
    import { goto } from "$app/navigation";
    import { CircleAlert } from "@lucide/svelte";
    import { addGameFormSchema, type AddGameFormSchema } from "./schemas";
    import { page } from "$app/state";
    import BlurFade from "$src/lib/components/custom/BlurFade.svelte";
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
    import { GamesStore } from "$src/lib/stores/games.svelte";
    import Loader from "$src/lib/components/custom/Loader.svelte";

    const folders = page.data["folders"] as string[];
    let { data }: { data: { form: SuperValidated<Infer<AddGameFormSchema>> } } = $props();

    const form = superForm(data.form, {
        dataType: "json",
        validators: zodClient(addGameFormSchema),
        onResult: async (result) => {
            if (result.result.type === "success") {
                toast.success("Jeu ajouté avec succès", { class: "bg-green-500" });
                $formData.cover = {};
                $formData.screenshots = {};
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

    // Handle game selection from search
    function handleGameSelect(game: Game) {
        // Populate form fields with game data
        $formData.title = game.name || "";
        $formData.description = game.summary || "";

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
        // Populate basic game information
        $formData.title = game.title || "";
        $formData.folderSlug = game.folderSlug || "";
        $formData.description = game.description || "";
        $formData.startCommand = game.startCommand || "";
        $formData.mainProcessName = game.mainProcessName || "";
        $formData.sizeGb = game.sizeGb || 1;
        $formData.maxPlayers = game.maxPlayers || 1;
        $formData.genres = game.genres || [];

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
</script>

<BlurFade delay={0.3} class="text-3xl font-bold">Gestion des jeux</BlurFade>
<div class="grid grid-cols-3 gap-8">
    <div>
        <!-- Games list -->
        <GamesList gameSelected={handleInstallableGameSelect} />
    </div>
    <form method="POST" class="flex flex-col gap-4" use:enhance>
        <BlurFade delay={0.3} class="text-3xl font-bold">Ajouter/Modifier un jeu</BlurFade>
        {#if $allErrors.length > 0}
            <Alert.Root variant="destructive">
                <CircleAlert class="size-4" />
                <Alert.Title>Erreur{$allErrors.length > 0 && "s"}</Alert.Title>
                <Alert.Description>
                    <ul>
                        {#each $allErrors as error}
                            <li>
                                {error.messages.join(". ")}
                            </li>
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

        <Form.Button disabled={$submitting}>
            {#if $submitting}
                <Loader size={24} />
            {:else}
                Valider
            {/if}
        </Form.Button>
        {#if browser && import.meta.env.DEV}
            <SuperDebug data={$formData} />
        {/if}
    </form>

    <!-- Right column for images -->
    <div class="flex flex-col gap-6">
        <CoverImageUpload
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
