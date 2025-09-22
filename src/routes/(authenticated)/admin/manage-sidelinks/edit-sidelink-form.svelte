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
    import { sidelinkFormSchema, type SidelinkFormSchema } from "./schema";
    import type { sidelink } from "@prisma/client";
    import { liveServerConnection } from "$src/lib/states/live-server.svelte";
    import { Checkbox } from "$src/lib/components/ui/checkbox";

    const {
        data,
        sidelink: sidelinkData,
    }: {
        data: { editForm: SuperValidated<Infer<SidelinkFormSchema>> };
        sidelink: sidelink;
    } = $props();

    // Initialize the form with the sidelink data
    const editForm = superForm(data.editForm, {
        dataType: "json",
        validators: zod4Client(sidelinkFormSchema),
        clearOnSubmit: "none",
        onResult: async (result) => {
            if (result.result.type === "success") {
                toast.success("Lien mis à jour avec succès", { class: "bg-green-500" });
                await invalidateAll(); // Refresh data
                await liveServerConnection.broadcastMessage("SideLinksUpdated");
            } else if (result.result.type === "error") {
                toast.error("Erreur lors de la mise à jour du lien : " + result.result.error);
            }
        },
        onError: (event) => {
            toast.error("Erreur lors de la mise à jour du lien");
            console.error("Form submission error:", event);
        },
    });

    const { form, enhance, allErrors, submitting } = editForm;

    // Function to check if all required fields are filled
    function areAllFieldsFilled() {
        return $form.name && $form.name.length >= 2 && $form.url && $form.url.length >= 2;
    }

    // Update form data with sidelink information
    $effect(() => {
        if (sidelinkData) {
            console.log("Updating edit form with sidelink data:", sidelinkData);
            $form.id = sidelinkData.id;
            $form.name = sidelinkData.name;
            $form.url = sidelinkData.url;
            $form.hidden = sidelinkData.hidden;
        }
    });
</script>

<Card.Root class="w-full">
    <Card.Header>
        <Card.Title>
            <BlurFade delay={0.3} class="text-2xl font-bold">Modifier un lien</BlurFade>
        </Card.Title>
    </Card.Header>
    <Card.Content>
        <form method="POST" action="?/update" class="flex flex-col gap-4" use:enhance>
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
                <!-- Hidden field for id when editing -->
                <input type="hidden" name="id" value={sidelinkData.id} />

                <Form.Field form={editForm} name="name">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="name">Nom</Label>
                            <Input {...props} required bind:value={$form.name} />
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>

                <Form.Field form={editForm} name="url">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="url">URL</Label>
                            <Input {...props} type="url" required bind:value={$form.url} />
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>

                <Form.Field form={editForm} name="hidden">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="hidden">Caché</Label>
                            <Checkbox {...props} bind:checked={$form.hidden} />
                            <input name={props.name} value={$form.hidden} hidden />
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>
            </div>

            <div class="flex gap-4">
                <Form.Button disabled={$submitting || !areAllFieldsFilled()}>
                    {#if $submitting}
                        <Loader size={24} />
                    {:else}
                        Mettre à jour
                    {/if}
                </Form.Button>
                <Button
                    type="button"
                    variant="outline"
                    onclick={() => {
                        // We need to dispatch a custom event to notify the parent component
                        // that we want to clear the selection
                        const event = new CustomEvent("clearSelection");
                        document.dispatchEvent(event);
                    }}>
                    Nouveau lien
                </Button>
            </div>

            {#if !areAllFieldsFilled() && !$submitting}
                <p class="mt-2 text-sm text-amber-500">
                    <CircleAlert class="mr-1 inline-block size-4" />
                    Veuillez remplir tous les champs obligatoires avant de soumettre le formulaire
                </p>
            {/if}

            {#if browser && import.meta.env.DEV}
                <SuperDebug data={$form} />
            {/if}
        </form>
    </Card.Content>
</Card.Root>
