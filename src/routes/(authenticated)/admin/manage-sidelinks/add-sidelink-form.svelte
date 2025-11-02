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
        validators: zod4Client(sidelinkFormSchema),
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

<Card.Root class="sticky top-4 w-full">
    <Card.Header class="border-b">
        <div class="space-y-1">
            <Card.Title>
                <BlurFade delay={0.3} class="text-xl font-bold">Ajouter un lien</BlurFade>
            </Card.Title>
            <p class="text-sm text-muted-foreground">Créez un nouveau lien de sidebar</p>
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
                            <Label for="name" class="text-sm font-semibold">Nom</Label>
                            <Input {...props} required bind:value={$formData.name} placeholder="Ex: Documentation" />
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>

                <Form.Field {form} name="url">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="url" class="text-sm font-semibold">URL</Label>
                            <Input {...props} required type="url" bind:value={$formData.url} placeholder="Ex: https://example.com" />
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>

                <Form.Field {form} name="hidden">
                    <Form.Control>
                        {#snippet children({ props })}
                            <div class="flex items-center gap-3">
                                <Checkbox {...props} bind:checked={$formData.hidden} id="hidden" />
                                <Label for="hidden" class="text-sm font-semibold cursor-pointer">Masquer ce lien</Label>
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
                        Ajouter le lien
                    {/if}
                </FormButton>

                {#if !areAllFieldsFilled() && !$submitting}
                    <div class="rounded-md bg-amber-50 dark:bg-amber-950/20 p-3 text-sm text-amber-800 dark:text-amber-200">
                        <div class="flex gap-2">
                            <CircleAlert class="size-4 mt-0.5 shrink-0" />
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
