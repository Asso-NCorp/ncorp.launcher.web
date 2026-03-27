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
    import { type EventFormSchema, eventFormSchema } from "./schema";
    import { Label } from "formsnap";
    import { Input } from "$src/lib/components/ui/input";
    import { Textarea } from "$src/lib/components/ui/textarea";
    import * as Card from "$lib/components/ui/card";

    const {
        data,
    }: {
        data: {
            addForm: SuperValidated<Infer<EventFormSchema>>;
        };
    } = $props();

    const form = superForm(data.addForm, {
        dataType: "json",
        validators: zod4Client(eventFormSchema),
        onResult: async (result) => {
            if (result.result.type === "success") {
                toast.success("Événement ajouté avec succès", { class: "bg-green-500" });
                await invalidateAll();
                form.reset();
            } else if (result.result.type === "error") {
                toast.error("Erreur lors de l'ajout de l'événement : " + result.result.error);
            }
        },
        onError: (event) => {
            toast.error("Erreur lors de l'ajout de l'événement");
            console.error("Form submission error:", event);
        },
    });

    const { form: formData, enhance, allErrors, submitting } = form;

    function areAllFieldsFilled() {
        return $formData.name && $formData.name.length >= 2 && $formData.start_time;
    }
</script>

<Card.Root class="sticky top-4 w-full">
    <Card.Header class="border-b">
        <div class="space-y-1">
            <Card.Title>
                <BlurFade delay={0.3} class="text-xl font-bold">Ajouter un événement</BlurFade>
            </Card.Title>
            <p class="text-muted-foreground text-sm">Créez un nouvel événement</p>
        </div>
    </Card.Header>
    <Card.Content class="pt-6">
        <form method="POST" action="?/add" class="flex flex-col gap-6" autocomplete="off" use:enhance>
            {#if $allErrors.length > 0}
                <Alert.Root variant="destructive">
                    <CircleAlert class="size-4" />
                    <Alert.Title>Erreur{$allErrors.length > 1 ? "s" : ""}</Alert.Title>
                    <Alert.Description>
                        <ul class="mt-2 space-y-1">
                            {#each $allErrors as error}
                                <li class="text-sm">• {error.messages.join(". ")}</li>
                            {/each}
                        </ul>
                    </Alert.Description>
                </Alert.Root>
            {/if}

            <div class="space-y-5">
                <Form.Field {form} name="name">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="name" class="text-sm font-semibold">Nom</Label>
                            <Input {...props} required bind:value={$formData.name} placeholder="Ex: Tournoi CS2" />
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>

                <Form.Field {form} name="description">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="description" class="text-sm font-semibold">Description</Label>
                            <Textarea
                                {...props}
                                bind:value={$formData.description}
                                placeholder="Description de l'événement..."
                                rows={3} />
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>

                <Form.Field {form} name="start_time">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="start_time" class="text-sm font-semibold">Date de début</Label>
                            <Input {...props} required type="datetime-local" bind:value={$formData.start_time} />
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>

                <Form.Field {form} name="end_time">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="end_time" class="text-sm font-semibold">Date de fin (optionnelle)</Label>
                            <Input {...props} type="datetime-local" bind:value={$formData.end_time} />
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>

                <Form.Field {form} name="url">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="url" class="text-sm font-semibold">URL (optionnelle)</Label>
                            <Input {...props} bind:value={$formData.url} placeholder="Ex: /events/tournoi-cs2" />
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>

                <Form.Field {form} name="image_url">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="image_url" class="text-sm font-semibold">Image URL (optionnelle)</Label>
                            <Input
                                {...props}
                                bind:value={$formData.image_url}
                                placeholder="Ex: https://example.com/image.png" />
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
                        Ajouter l'événement
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
