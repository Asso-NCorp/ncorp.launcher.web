<script lang="ts">
    import * as Alert from "$lib/components/ui/alert";
    import { toast } from "svelte-sonner";
    import SuperDebug, { type SuperValidated, type Infer, superForm } from "sveltekit-superforms";
    import { zodClient } from "sveltekit-superforms/adapters";
    import { invalidateAll } from "$app/navigation";
    import { CircleAlert } from "@lucide/svelte";
    import BlurFade from "$src/lib/components/custom/BlurFade.svelte";
    import FormButton from "$src/lib/components/ui/form/form-button.svelte";
    import Loader from "$src/lib/components/custom/Loader.svelte";
    import * as Form from "$lib/components/ui/form";
    import { browser } from "$app/environment";
    import { type SidelinkFormSchema, sidelinkFormSchema } from "./schema";
    import { Label } from "formsnap";
    import { Input } from "$src/lib/components/ui/input";
    import * as Card from "$lib/components/ui/card";
    import { global } from "$lib/states/global.svelte";
    import { liveServerConnection } from "$src/lib/states/live-server.svelte";
    import { Checkbox } from "$src/lib/components/ui/checkbox";

    const {
        data,
    }: {
        data: {
            addForm: SuperValidated<Infer<SidelinkFormSchema>>;
        };
    } = $props();

    // Initialize the form
    const form = superForm(data.addForm, {
        dataType: "json",
        validators: zodClient(sidelinkFormSchema),
        onResult: async (result) => {
            if (result.result.type === "success") {
                toast.success("Lien ajouté avec succès", { class: "bg-green-500" });
                await invalidateAll(); // Refresh data

                // Reset the form
                form.reset();
                await liveServerConnection.broadcastMessage("SideLinksUpdated");
            } else if (result.result.type === "error") {
                toast.error("Erreur lors de l'ajout du lien : " + result.result.error);
            }
        },
        onError: (event) => {
            toast.error("Erreur lors de l'ajout du lien");
            console.error("Form submission error:", event);
        },
    });

    const { form: formData, enhance, allErrors, submitting } = form;

    // Function to check if all required fields are filled
    function areAllFieldsFilled() {
        return $formData.name && $formData.name.length >= 2 && $formData.url && $formData.url.length >= 2;
    }
</script>

<Card.Root class="w-full">
    <Card.Header>
        <Card.Title>
            <BlurFade delay={0.3} class="text-2xl font-bold">Ajouter un lien</BlurFade>
        </Card.Title>
    </Card.Header>
    <Card.Content>
        <form method="POST" action="?/add" class="flex flex-col gap-4" autocomplete="off" use:enhance>
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

            <div class="space-y-4">
                <Form.Field {form} name="name">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="name">Nom</Label>
                            <Input {...props} required bind:value={$formData.name} />
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>

                <Form.Field {form} name="url">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="url">URL</Label>
                            <Input {...props} required type="url" bind:value={$formData.url} />
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>

                <Form.Field {form} name="hidden">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="hidden">Caché</Label>
                            <Checkbox {...props} bind:checked={$formData.hidden} />
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>
            </div>

            <div class="flex gap-4">
                <FormButton disabled={$submitting || !areAllFieldsFilled()}>
                    {#if $submitting}
                        <Loader size={24} />
                    {:else}
                        Ajouter
                    {/if}
                </FormButton>
            </div>

            {#if !areAllFieldsFilled() && !$submitting}
                <p class="mt-2 text-sm text-amber-500">
                    <CircleAlert class="mr-1 inline-block size-4" />
                    Veuillez remplir tous les champs obligatoires avant de soumettre le formulaire
                </p>
            {/if}

            {#if browser && import.meta.env.DEV}
                <SuperDebug data={$formData} />
            {/if}
        </form>
    </Card.Content>
</Card.Root>
