<script lang="ts">
    import * as Alert from "$lib/components/ui/alert";
    import { toast } from "svelte-sonner";
    import SuperDebug, { type SuperValidated, type Infer, superForm } from "sveltekit-superforms";
    import { zodClient } from "sveltekit-superforms/adapters";
    import { goto, invalidateAll } from "$app/navigation";
    import { CircleAlert } from "@lucide/svelte";
    import BlurFade from "$src/lib/components/custom/BlurFade.svelte";
    import FormButton from "$src/lib/components/ui/form/form-button.svelte";
    import Loader from "$src/lib/components/custom/Loader.svelte";
    import * as Form from "$lib/components/ui/form";
    import { browser } from "$app/environment";
    import { type UserFormSchema, userFormSchema } from "./schema";
    import { Label } from "formsnap";
    import { Input } from "$src/lib/components/ui/input";
    import * as Card from "$lib/components/ui/card";
    import { Check } from "@lucide/svelte";
    import * as Select from "$lib/components/ui/select/index.js";

    // Debounce function to limit API calls while typing
    function debounce<T extends (...args: any[]) => any>(fn: T, delay = 300) {
        let timeoutId: ReturnType<typeof setTimeout>;
        return (...args: Parameters<T>) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(undefined, args), delay);
        };
    }

    // State for form validation
    let usernameChecking = $state(false);
    let usernameAvailable = $state(false);
    let usernameError = $state<string | null>(null);

    // Function to check if all required fields are filled
    function areAllFieldsFilled() {
        return (
            $formData.username &&
            $formData.username.length >= 2 &&
            $formData.name &&
            $formData.name.length >= 2 &&
            $formData.email &&
            $formData.email.includes("@") &&
            $formData.role &&
            $formData.role.length >= 1 &&
            $formData.password &&
            $formData.password.length >= 8 &&
            usernameAvailable &&
            !usernameError
        );
    }

    // Available roles for the select dropdown
    const availableRoles = ["user", "admin"];

    const {
        data,
    }: {
        data: {
            addForm: SuperValidated<Infer<UserFormSchema>>;
        };
    } = $props();

    // Initialize the form
    const form = superForm(data.addForm, {
        dataType: "json",
        validators: zodClient(userFormSchema),
        onResult: async (result) => {
            if (result.result.type === "success") {
                toast.success("Utilisateur ajouté avec succès", { class: "bg-green-500" });
                await invalidateAll(); // Refresh data

                // Reset the form
                form.reset();
                usernameAvailable = false;
                usernameError = null;
            } else if (result.result.type === "redirect") {
                goto(result.result.location);
            } else if (result.result.type === "error") {
                toast.error("Erreur lors de l'ajout de l'utilisateur : " + result.result.error);
            }
        },
        onError: (event) => {
            toast.error("Erreur lors de l'ajout de l'utilisateur");
            console.error("Form submission error:", event);
        },
    });

    const { form: formData, enhance, allErrors, submitting } = form;

    // Function to check if username exists
    const checkUsername = debounce(async (username: string) => {
        // Skip check if username is empty
        if (!username || username.length < 2) {
            usernameChecking = false;
            usernameAvailable = false;
            usernameError = null;
            return;
        }

        // Set a minimum delay before showing the loader to prevent flickering
        let loaderTimeout: ReturnType<typeof setTimeout>;
        const minLoaderDelay = 300; // ms

        // Start a timer to show the loader after a short delay
        loaderTimeout = setTimeout(() => {
            usernameChecking = true;
        }, minLoaderDelay);

        usernameAvailable = false;
        usernameError = null;

        try {
            // Record the start time
            const startTime = Date.now();

            // Call the real API endpoint to check if username exists
            const response = await fetch(`/api/check-username?username=${encodeURIComponent(username)}`);

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            const exists = data.exists;

            // Calculate how long the request took
            const elapsedTime = Date.now() - startTime;

            // If the request was faster than our minimum display time,
            // wait a bit before updating the UI to ensure a smooth experience
            if (elapsedTime < minLoaderDelay) {
                await new Promise((resolve) => setTimeout(resolve, minLoaderDelay - elapsedTime));
            }

            usernameAvailable = !exists;
            if (exists) {
                usernameError = "Ce nom d'utilisateur est déjà pris";
            }
        } catch (error) {
            console.error("Error checking username:", error);
            usernameError = "Erreur lors de la vérification du nom d'utilisateur";
        } finally {
            // Clear the loader timeout if it hasn't triggered yet
            clearTimeout(loaderTimeout);
            usernameChecking = false;
        }
    }, 500);

    // Create a separate state to track the username value
    let currentUsername = $state("");

    // Watch for changes to username and check if it exists
    $effect(() => {
        // Only update currentUsername when the username field changes
        if ($formData.username !== currentUsername) {
            currentUsername = $formData.username;

            if (currentUsername) {
                checkUsername(currentUsername);
            } else {
                usernameChecking = false;
                usernameAvailable = false;
                usernameError = null;
            }
        }
    });
</script>

<Card.Root class="w-full">
    <Card.Header>
        <Card.Title>
            <BlurFade delay={0.3} class="text-2xl font-bold">Ajouter un utilisateur</BlurFade>
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

            <!-- No userId needed for adding a new user -->

            <div class="space-y-4">
                <Form.Field {form} name="username">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="username">Nom d'utilisateur</Label>
                            <div class="relative">
                                <Input
                                    {...props}
                                    required
                                    bind:value={$formData.username}
                                    class={usernameError
                                        ? "border-red-500 pr-10"
                                        : usernameAvailable && $formData.username
                                          ? "border-green-500 pr-10"
                                          : "pr-10"} />
                                <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                                    {#if usernameChecking}
                                        <Loader size={24} />
                                    {:else if usernameAvailable && $formData.username}
                                        <Check class="size-4 text-green-500" />
                                    {/if}
                                </div>
                            </div>
                            {#if usernameError}
                                <p class="mt-1 text-xs text-red-500">{usernameError}</p>
                            {:else if usernameAvailable && $formData.username}
                                <p class="mt-1 text-xs text-green-500">Nom d'utilisateur disponible</p>
                            {/if}
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>

                <Form.Field {form} name="name">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="name">Pseudo</Label>
                            <Input {...props} required bind:value={$formData.name} />
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>

                <Form.Field {form} name="email">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="email">Email</Label>
                            <Input {...props} type="email" required autocomplete="off" bind:value={$formData.email} />
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>

                <Form.Field {form} name="role">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="role">Rôle</Label>
                            <Select.Root type="single" required bind:value={$formData.role} {...props}>
                                <Select.Trigger class="w-full">
                                    <span>{$formData.role || "Sélectionner un rôle"}</span>
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

                <Form.Field {form} name="password">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="password">Mot de passe</Label>
                            <Input
                                autocomplete="new-password"
                                {...props}
                                type="password"
                                required
                                bind:value={$formData.password} />
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>
            </div>

            <div class="flex gap-4">
                <FormButton
                    disabled={$submitting ||
                        Boolean($formData.username && (usernameChecking || usernameError !== null)) ||
                        !areAllFieldsFilled()}>
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
