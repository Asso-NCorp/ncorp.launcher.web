<script lang="ts">
    import { superForm, type SuperValidated } from "sveltekit-superforms";
    import { zod4Client } from "sveltekit-superforms/adapters";
    import { browser } from "$app/environment";
    import { invalidateAll } from "$app/navigation";
    import { toast } from "svelte-sonner";
    import type { Infer } from "sveltekit-superforms";
    import { Label } from "formsnap";
    import { Input } from "$src/lib/components/ui/input";
    import { Textarea } from "$src/lib/components/ui/textarea";
    import { Button } from "$lib/components/ui/button";
    import * as Card from "$lib/components/ui/card";
    import { CircleAlert, Loader } from "@lucide/svelte";
    import * as Alert from "$lib/components/ui/alert";
    import BlurFade from "$src/lib/components/custom/BlurFade.svelte";
    import SuperDebug from "sveltekit-superforms/client/SuperDebug.svelte";
    import * as Form from "$lib/components/ui/form";
    import { eventFormSchema, type EventFormSchema } from "./schema";
    import type { event } from "$src/generated/prisma/client";
    import dayjs from "dayjs";

    const {
        data,
        event: eventData,
    }: {
        data: { editForm: SuperValidated<Infer<EventFormSchema>> };
        event: event;
    } = $props();

    const editForm = superForm(data.editForm, {
        dataType: "json",
        validators: zod4Client(eventFormSchema),
        clearOnSubmit: "none",
        onResult: async (result) => {
            if (result.result.type === "success") {
                toast.success("Événement mis à jour avec succès", { class: "bg-green-500" });
                await invalidateAll();
            } else if (result.result.type === "error") {
                toast.error("Erreur lors de la mise à jour : " + result.result.error);
            }
        },
        onError: (event) => {
            toast.error("Erreur lors de la mise à jour de l'événement");
            console.error("Form submission error:", event);
        },
    });

    const { form, enhance, allErrors, submitting } = editForm;

    function areAllFieldsFilled() {
        return $form.name && $form.name.length >= 2 && $form.start_time;
    }

    const toLocalDatetime = (d: Date | null | undefined) => (d ? dayjs(d).format("YYYY-MM-DDTHH:mm") : "");

    $effect(() => {
        if (eventData) {
            $form.id = eventData.id;
            $form.name = eventData.name;
            $form.description = eventData.description ?? "";
            $form.url = eventData.url ?? "";
            $form.start_time = toLocalDatetime(eventData.start_time);
            $form.end_time = toLocalDatetime(eventData.end_time);
            $form.image_url = eventData.image_url ?? "";
        }
    });
</script>

<Card.Root class="sticky top-4 w-full">
    <Card.Header class="border-b">
        <div class="space-y-1">
            <Card.Title>
                <BlurFade delay={0.3} class="text-xl font-bold">Modifier un événement</BlurFade>
            </Card.Title>
            <p class="text-muted-foreground text-sm">Mettez à jour les détails de l'événement</p>
        </div>
    </Card.Header>
    <Card.Content class="pt-6">
        <form method="POST" action="?/update" class="flex flex-col gap-6" use:enhance>
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
                <input type="hidden" name="id" value={eventData.id} />

                <Form.Field form={editForm} name="name">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="name" class="text-sm font-semibold">Nom</Label>
                            <Input {...props} required bind:value={$form.name} placeholder="Ex: Tournoi CS2" />
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>

                <Form.Field form={editForm} name="description">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="description" class="text-sm font-semibold">Description</Label>
                            <Textarea
                                {...props}
                                bind:value={$form.description}
                                placeholder="Description de l'événement..."
                                rows={3} />
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>

                <Form.Field form={editForm} name="start_time">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="start_time" class="text-sm font-semibold">Date de début</Label>
                            <Input {...props} required type="datetime-local" bind:value={$form.start_time} />
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>

                <Form.Field form={editForm} name="end_time">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="end_time" class="text-sm font-semibold">Date de fin (optionnelle)</Label>
                            <Input {...props} type="datetime-local" bind:value={$form.end_time} />
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>

                <Form.Field form={editForm} name="url">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="url" class="text-sm font-semibold">URL (optionnelle)</Label>
                            <Input {...props} bind:value={$form.url} placeholder="Ex: /events/tournoi-cs2" />
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>

                <Form.Field form={editForm} name="image_url">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="image_url" class="text-sm font-semibold">Image URL (optionnelle)</Label>
                            <Input
                                {...props}
                                bind:value={$form.image_url}
                                placeholder="Ex: https://example.com/image.png" />
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>
            </div>

            <div class="space-y-3 border-t pt-4">
                <div class="flex gap-2">
                    <Form.Button disabled={$submitting || !areAllFieldsFilled()}>
                        {#if $submitting}
                            <Loader size={16} />
                        {:else}
                            Mettre à jour
                        {/if}
                    </Form.Button>
                    <Button
                        type="button"
                        variant="outline"
                        onclick={() => {
                            document.dispatchEvent(new CustomEvent("clearSelection"));
                        }}>
                        Nouveau
                    </Button>
                </div>

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
