<script lang="ts">
    import { superForm, type SuperValidated } from "sveltekit-superforms";
    import { zod4Client } from "sveltekit-superforms/adapters";
    import { browser } from "$app/environment";
    import { invalidateAll } from "$app/navigation";
    import { toast } from "svelte-sonner";
    import type { Infer } from "sveltekit-superforms";
    import { Label } from "formsnap";
    import { Input } from "$src/lib/components/ui/input";
    import { Button } from "$lib/components/ui/button";
    import * as Card from "$lib/components/ui/card";
    import { CircleAlert, Loader } from "@lucide/svelte";
    import * as Alert from "$lib/components/ui/alert";
    import BlurFade from "$src/lib/components/custom/BlurFade.svelte";
    import SuperDebug from "sveltekit-superforms/client/SuperDebug.svelte";
    import * as Form from "$lib/components/ui/form";
    import { gameServerFormSchema, type GameServerFormSchema } from "./schema";
    import type { game_server } from "@prisma/client";
    import { Checkbox } from "$src/lib/components/ui/checkbox";
    import * as Select from "$lib/components/ui/select";
    import { Textarea } from "$src/lib/components/ui/textarea";
    import SearchDropdown from "$src/lib/components/custom/dropdowns/SearchDropdown.svelte";

    const {
        data,
        gameServer: gameServerData,
    }: {
        data: {
            editForm: SuperValidated<Infer<GameServerFormSchema>>;
            games: { folder_slug: string; title: string }[];
        };
        gameServer: game_server;
    } = $props();

    // Initialize the form with the game server data
    const editForm = superForm(data.editForm, {
        dataType: "json",
        validators: zod4Client(gameServerFormSchema),
        clearOnSubmit: "none",
        onResult: async (result) => {
            if (result.result.type === "success") {
                toast.success("Serveur mis à jour avec succès", { class: "bg-green-500" });
                await invalidateAll(); // Refresh data
            } else if (result.result.type === "error") {
                toast.error("Erreur lors de la mise à jour du serveur : " + result.result.error);
            }
        },
        onError: (event) => {
            toast.error("Erreur lors de la mise à jour du serveur");
            console.error("Form submission error:", event);
        },
    });

    const { form, enhance, allErrors, submitting } = editForm;

    // Transform games data for SearchDropdown
    const gameOptions = data.games.map((g) => ({
        name: g.title,
        folder_slug: g.folder_slug,
    }));

    // Selected game for the dropdown
    let selectedGame = $state<string | { name: string; folder_slug: string }>("");

    // Watch for selectedGame changes and update form data
    let isInitialLoad = true;
    $effect(() => {
        if (selectedGame && !isInitialLoad) {
            if (typeof selectedGame === "string") {
                $form.game_slug = selectedGame;
                const game = data.games.find((g) => g.folder_slug === selectedGame);
                if (game) {
                    $form.game_title = game.title;
                }
            } else {
                $form.game_slug = selectedGame.folder_slug;
                $form.game_title = selectedGame.name;
            }
        }
    });

    // Function to check if all required fields are filled
    function areAllFieldsFilled() {
        return (
            $form.game_slug &&
            $form.game_slug.length >= 1 &&
            $form.game_title &&
            $form.game_title.length >= 2 &&
            $form.name &&
            $form.name.length >= 2 &&
            $form.type &&
            $form.port &&
            $form.port > 0 &&
            $form.port <= 65535
        );
    }

    // Update form data with game server information
    $effect(() => {
        if (gameServerData) {
            $form.id = gameServerData.id;
            $form.game_slug = gameServerData.game_slug;
            $form.game_title = gameServerData.game_title;
            $form.type = gameServerData.type as "tcp" | "udp";
            $form.port = gameServerData.port;
            $form.description = gameServerData.description || "";
            $form.name = gameServerData.name;
            $form.monitor = gameServerData.monitor;

            // Set the selected game for the dropdown
            const game = gameOptions.find((g) => g.folder_slug === gameServerData.game_slug);
            if (game) {
                selectedGame = game;
            }
            isInitialLoad = false;
        }
    });
</script>

<Card.Root class="sticky top-4 w-full">
    <Card.Header class="border-b">
        <div class="space-y-1">
            <Card.Title>
                <BlurFade delay={0.3} class="text-xl font-bold">Modifier un serveur</BlurFade>
            </Card.Title>
            <p class="text-muted-foreground text-sm">Mettez à jour les détails du serveur</p>
        </div>
    </Card.Header>
    <Card.Content class="pt-6">
        <form method="POST" action="?/update" class="flex flex-col gap-6" use:enhance>
            {#if $allErrors.length > 0}
                <Alert.Root variant="destructive">
                    <CircleAlert class="size-4" />
                    <Alert.Title>Erreur{$allErrors.length > 0 && "s"}</Alert.Title>
                    <Alert.Description>
                        <ul class="mt-2 space-y-1">
                            {#each $allErrors as error}
                                <li class="text-sm">
                                    • {error.messages.join(". ")}
                                </li>
                            {/each}
                        </ul>
                    </Alert.Description>
                </Alert.Root>
            {/if}

            <div class="space-y-5">
                <!-- Hidden field for id when editing -->
                <input type="hidden" name="id" value={gameServerData.id} />

                <Form.Field form={editForm} name="name">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="name" class="text-sm font-semibold">Nom du serveur</Label>
                            <Input
                                {...props}
                                required
                                bind:value={$form.name}
                                placeholder="Ex: Serveur principal CS:GO" />
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>

                <Form.Field form={editForm} name="game_slug">
                    <Form.Control>
                        {#snippet children()}
                            <Label for="game_slug" class="text-sm font-semibold">Sélectionner un jeu</Label>
                            <SearchDropdown
                                options={gameOptions}
                                bind:value={selectedGame}
                                displayField="name"
                                placeholder="Sélectionnez un jeu"
                                searchPlaceholder="Rechercher un jeu..." />
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>

                <!-- Hidden field for game_title -->
                <input type="hidden" name="game_title" bind:value={$form.game_title} />

                <Form.Field form={editForm} name="type">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="type" class="text-sm font-semibold">Type de protocole</Label>
                            <Select.Root type="single" required bind:value={$form.type} {...props}>
                                <Select.Trigger class="w-full">
                                    <span>{$form.type ? $form.type.toUpperCase() : "Sélectionnez un type"}</span>
                                </Select.Trigger>
                                <Select.Content>
                                    <Select.Item value="tcp">TCP</Select.Item>
                                    <Select.Item value="udp">UDP</Select.Item>
                                </Select.Content>
                            </Select.Root>
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>

                <Form.Field form={editForm} name="port">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="port" class="text-sm font-semibold">Port</Label>
                            <Input
                                {...props}
                                required
                                type="number"
                                bind:value={$form.port}
                                placeholder="Ex: 27015"
                                min="1"
                                max="65535" />
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>

                <Form.Field form={editForm} name="description">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="description" class="text-sm font-semibold">Description (optionnel)</Label>
                            <Textarea
                                {...props}
                                bind:value={$form.description}
                                placeholder="Description du serveur"
                                rows={3} />
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>

                <Form.Field form={editForm} name="monitor">
                    <Form.Control>
                        {#snippet children({ props })}
                            <div class="flex items-center gap-3">
                                <Checkbox bind:checked={$form.monitor} {...props} id="monitor" />
                                <Label for="monitor" class="cursor-pointer text-sm font-semibold">
                                    Activer le monitoring
                                </Label>
                            </div>
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>
            </div>

            <div class="space-y-3 border-t pt-4">
                <Button type="submit" disabled={$submitting || !areAllFieldsFilled()} class="w-full">
                    {#if $submitting}
                        <Loader class="mr-2 size-4 animate-spin" />
                        Mise à jour en cours...
                    {:else}
                        Mettre à jour le serveur
                    {/if}
                </Button>

                {#if !areAllFieldsFilled() && !$submitting}
                    <div
                        class="rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
                        <div class="flex gap-2">
                            <CircleAlert class="mt-0.5 size-4 shrink-0" />
                            <p>Veuillez remplir tous les champs obligatoires</p>
                        </div>
                    </div>
                {/if}
            </div>

            {#if browser && import.meta.env.DEV}
                <SuperDebug data={$form} />
            {/if}
        </form>
    </Card.Content>
</Card.Root>
