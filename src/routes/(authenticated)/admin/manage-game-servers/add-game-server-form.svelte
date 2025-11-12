<script lang="ts">
    import * as Alert from "$lib/components/ui/alert";
    import { toast } from "svelte-sonner";
    import SuperDebug, { type SuperValidated, type Infer, superForm } from "sveltekit-superforms";
    import { zod4Client } from "sveltekit-superforms/adapters";
    import { invalidateAll } from "$app/navigation";
    import { CircleAlert } from "@lucide/svelte";
    import BlurFade from "$src/lib/components/custom/BlurFade.svelte";
    import FormButton from "$src/lib/components/ui/form/form-button.svelte";
    import Loader from "$src/lib/components/custom/Loader.svelte";
    import * as Form from "$lib/components/ui/form";
    import { browser } from "$app/environment";
    import { type GameServerFormSchema, gameServerFormSchema } from "./schema";
    import { Label } from "formsnap";
    import { Input } from "$src/lib/components/ui/input";
    import * as Card from "$lib/components/ui/card";
    import { Checkbox } from "$src/lib/components/ui/checkbox";
    import * as Select from "$lib/components/ui/select";
    import { Textarea } from "$src/lib/components/ui/textarea";
    import SearchDropdown from "$src/lib/components/custom/dropdowns/SearchDropdown.svelte";

    const {
        data,
    }: {
        data: {
            addForm: SuperValidated<Infer<GameServerFormSchema>>;
            games: { folder_slug: string; title: string }[];
        };
    } = $props();

    // Initialize the form
    const form = superForm(data.addForm, {
        dataType: "json",
        validators: zod4Client(gameServerFormSchema),
        onResult: async (result) => {
            if (result.result.type === "success") {
                toast.success("Serveur de jeu ajouté avec succès", { class: "bg-green-500" });
                await invalidateAll(); // Refresh data

                // Reset the form
                form.reset();
            } else if (result.result.type === "error") {
                toast.error("Erreur lors de l'ajout du serveur : " + result.result.error);
            }
        },
        onError: (event) => {
            toast.error("Erreur lors de l'ajout du serveur");
            console.error("Form submission error:", event);
        },
    });

    const { form: formData, enhance, allErrors, submitting } = form;

    // Transform games data for SearchDropdown (use folder_slug as value)
    const gameOptions = data.games.map((g) => ({
        name: g.title,
        folder_slug: g.folder_slug,
    }));

    // Selected game for the dropdown
    let selectedGame = $state<string | { name: string; folder_slug: string }>($formData.game_slug || "");

    // Watch for selectedGame changes and update form data
    $effect(() => {
        if (selectedGame) {
            if (typeof selectedGame === "string") {
                $formData.game_slug = selectedGame;
                const game = data.games.find((g) => g.folder_slug === selectedGame);
                if (game) {
                    $formData.game_title = game.title;
                }
            } else {
                $formData.game_slug = selectedGame.folder_slug;
                $formData.game_title = selectedGame.name;
            }
        }
    });

    // Function to check if all required fields are filled
    function areAllFieldsFilled() {
        return (
            $formData.game_slug &&
            $formData.game_slug.length >= 1 &&
            $formData.game_title &&
            $formData.game_title.length >= 2 &&
            $formData.name &&
            $formData.name.length >= 2 &&
            $formData.type &&
            $formData.port &&
            $formData.port > 0 &&
            $formData.port <= 65535
        );
    }
</script>

<Card.Root class="sticky top-4 w-full">
    <Card.Header class="border-b">
        <div class="space-y-1">
            <Card.Title>
                <BlurFade delay={0.3} class="text-xl font-bold">Ajouter un serveur</BlurFade>
            </Card.Title>
            <p class="text-muted-foreground text-sm">Créez un nouveau serveur de jeu</p>
        </div>
    </Card.Header>
    <Card.Content class="pt-6">
        <form method="POST" action="?/add" class="flex flex-col gap-6" autocomplete="off" use:enhance>
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
                <Form.Field {form} name="name">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="name" class="text-sm font-semibold">Nom du serveur</Label>
                            <Input
                                {...props}
                                required
                                bind:value={$formData.name}
                                placeholder="Ex: Serveur principal CS:GO" />
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>

                <Form.Field {form} name="game_slug">
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
                <input type="hidden" name="game_title" bind:value={$formData.game_title} />

                <Form.Field {form} name="type">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="type" class="text-sm font-semibold">Type de protocole</Label>
                            <Select.Root type="single" required bind:value={$formData.type} {...props}>
                                <Select.Trigger class="w-full">
                                    <span>
                                        {$formData.type ? $formData.type.toUpperCase() : "Sélectionnez un type"}
                                    </span>
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

                <Form.Field {form} name="port">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="port" class="text-sm font-semibold">Port</Label>
                            <Input
                                {...props}
                                required
                                type="number"
                                bind:value={$formData.port}
                                placeholder="Ex: 27015"
                                min="1"
                                max="65535" />
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>

                <Form.Field {form} name="description">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="description" class="text-sm font-semibold">Description (optionnel)</Label>
                            <Textarea
                                {...props}
                                bind:value={$formData.description}
                                placeholder="Description du serveur"
                                rows={3} />
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>

                <Form.Field {form} name="monitor">
                    <Form.Control>
                        {#snippet children({ props })}
                            <div class="flex items-center gap-3">
                                <Checkbox bind:checked={$formData.monitor} {...props} id="monitor" />
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
                <FormButton disabled={$submitting || !areAllFieldsFilled()} class="w-full">
                    {#if $submitting}
                        <Loader size={20} class="mr-2" />
                        Ajout en cours...
                    {:else}
                        Ajouter le serveur
                    {/if}
                </FormButton>

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
                <SuperDebug data={$formData} />
            {/if}
        </form>
    </Card.Content>
</Card.Root>
