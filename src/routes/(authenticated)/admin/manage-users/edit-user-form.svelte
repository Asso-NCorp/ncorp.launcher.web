<script lang="ts">
    import { superForm, type SuperValidated } from "sveltekit-superforms";
    import { zodClient } from "sveltekit-superforms/adapters";
    import { browser } from "$app/environment";
    import { goto, invalidateAll } from "$app/navigation";
    import { toast } from "svelte-sonner";
    import type { Infer } from "sveltekit-superforms";
    import { Label } from "formsnap";
    import { Input } from "$src/lib/components/ui/input";
    import { Button } from "$lib/components/ui/button";
    import * as Card from "$lib/components/ui/card";
    import { Check, CircleAlert, Loader } from "@lucide/svelte";
    import * as Alert from "$lib/components/ui/alert";
    import * as Select from "$lib/components/ui/select";
    import type { UserWithRole } from "better-auth/plugins/admin";
    import BlurFade from "$src/lib/components/custom/BlurFade.svelte";
    import SuperDebug from "sveltekit-superforms/client/SuperDebug.svelte";
    import * as Form from "$lib/components/ui/form";
    import { editUserFormSchema, type EditUserFormSchema } from "./schema";
    import type { User } from "$src/lib/auth/client";

    // Available roles for the select dropdown
    const availableRoles = ["user", "admin"];

    const {
        data,
        user,
        onSubmit, // optional callback prop
    }: {
        data: { editForm: SuperValidated<Infer<EditUserFormSchema>> };
        user: User;
        onSubmit?: (payload: {
            success: boolean;
            outcome?: any;
            error?: any;
        }) => void;
    } = $props();

    // Initialize the form with the user data
    const editForm = superForm(data.editForm, {
        dataType: "json",
        validators: zodClient(editUserFormSchema),
        clearOnSubmit: "none",
        onResult: async (result) => {
            const outcome = result.result;
            if (outcome.type === "success") {
                toast.success("Utilisateur mis à jour avec succès", { class: "bg-green-500" });
                await invalidateAll();
            } else if (outcome.type === "redirect") {
                // notify before navigating away
                onSubmit?.({ success: false, outcome });
                goto(outcome.location);
                return;
            } else if (outcome.type === "error") {
                toast.error("Erreur lors de la mise à jour de l'utilisateur : " + outcome.error);
            }
            // unified callback (fires for success + error)
            onSubmit?.({ success: outcome.type === "success", outcome });
        },
        onError: (event) => {
            toast.error("Erreur lors de la mise à jour de l'utilisateur");
            console.error("Form submission error:", event);
            onSubmit?.({ success: false, error: event });
        },
    });

    const { form, enhance, allErrors, submitting } = editForm;

    // Function to check if all required fields are filled
    function areAllFieldsFilled() {
        return (
            $form.username &&
            $form.username.length >= 2 &&
            $form.name &&
            $form.name.length >= 2 &&
            $form.email &&
            $form.email.includes("@") &&
            $form.role &&
            $form.role.length >= 1
            // Password is optional for editing
        );
    }

    // Update form data with user information
    $effect(() => {
        if (user) {
            console.log("Updating edit form with user data:", user);
            $form.name = user.name || "";
            $form.role = user.role || "";
            $form.email = user.email || "";
            $form.id = user.id; // Set the id for updates
            $form.username = user.username!; // Use ID as username for display
            $form.password = ""; // Don't populate password for security reasons
        }
    });
</script>

<Card.Root class="sticky top-4 w-full">
    <Card.Header>
        <Card.Title>
            <BlurFade delay={0.3} class="text-2xl font-bold">Modifier un utilisateur</BlurFade>
        </Card.Title>
    </Card.Header>
    <Card.Content class="max-h-[calc(100vh-12rem)] overflow-y-auto">
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
                <!-- Hidden field for userId when editing -->
                <input type="hidden" name="userId" value={user.id} />

                <Form.Field form={editForm} name="username">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="username">Identifiant</Label>
                            <Input {...props} bind:value={$form.username} disabled />
                            <Form.Description class="text-xs text-muted-foreground">
                                L'identifiant ne peut pas être modifié
                            </Form.Description>
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>

                <Form.Field form={editForm} name="name">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="name">Pseudo</Label>
                            <Form.Description class="text-xs text-muted-foreground">
                                Votre nom d'affichage
                            </Form.Description>
                            <Input {...props} required bind:value={$form.name} />
                        {/snippet}
                    </Form.Control>

                    <Form.FieldErrors />
                </Form.Field>

                <Form.Field form={editForm} name="email">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="email">Email</Label>
                            <Input {...props} type="email" required bind:value={$form.email} />
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>

                <Form.Field form={editForm} name="role">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="role">Rôle</Label>
                            <Select.Root type="single" required bind:value={$form.role} {...props}>
                                <Select.Trigger class="w-full">
                                    <span>{$form.role || "Sélectionner un rôle"}</span>
                                </Select.Trigger>
                                <Select.Content>
                                    {#each availableRoles as role}
                                        <Select.Item value={role}>{role}</Select.Item>
                                    {/each}
                                </Select.Content>
                            </Select.Root>
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>

                <Form.Field form={editForm} name="password">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="password">Mot de passe</Label>
                            <Input autocomplete="off" {...props} type="password" bind:value={$form.password} />
                            <p class="mt-1 text-xs text-muted-foreground">Laisser vide pour ne pas modifier</p>
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
                    Nouvel utilisateur
                </Button>
            </div>

            {#if browser && import.meta.env.DEV}
                <SuperDebug data={$form} />
            {/if}
        </form>
    </Card.Content>
</Card.Root>
