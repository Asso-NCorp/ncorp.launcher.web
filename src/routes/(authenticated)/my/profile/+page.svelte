<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/state";
    import type { User } from "$src/lib/auth/client";
    import type { PageData } from "./$types";
    import { Button } from "$src/lib/components/ui/button/";
    import * as Avatar from "$src/lib/components/ui/avatar/";
    import { Input } from "$src/lib/components/ui/input/";
    import { Label } from "$src/lib/components/ui/label/";
    import { toast } from "svelte-sonner";
    import { superForm, fileProxy } from "sveltekit-superforms";
    import { zodClient } from "sveltekit-superforms/adapters";
    import { profileFormSchema } from "./schema";
    import * as Form from "$lib/components/ui/form";
    import * as Alert from "$lib/components/ui/alert";
    import { CircleAlert } from "@lucide/svelte";
    import SuperDebug from "sveltekit-superforms/client/SuperDebug.svelte";
    let { data }: { data: PageData } = $props();
    const user = page.data["user"] as User;

    const form = superForm(data.profileForm, {
        validators: zodClient(profileFormSchema as any),
        onResult: async (result) => {
            console.log("Form result:", result);

            if (result.result.type === "success") {
                toast.success("Profil mis à jour avec succès!", { class: "bg-green-500" });

                // Clear the file input since the avatar has been saved
                if (fileInput) {
                    fileInput.value = "";
                }

                // Refresh the page data to get updated user info
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else if (result.result.type === "failure") {
                console.error("Form submission failed:", result.result);
                toast.error("Erreur lors de la mise à jour du profil", { class: "bg-red-500" });
            } else {
                console.error("Unexpected result type:", result.result);
                toast.error("Une erreur inattendue s'est produite", { class: "bg-red-500" });
            }
        },
        onError: (event) => {
            toast.error("Erreur lors de la mise à jour du profil");
            console.error("Form submission error:", event);
        },
    });

    const { form: formData, enhance, allErrors, submitting } = form;

    // Create file proxy for avatar file
    const avatarFileProxy = fileProxy(form, "avatarFile");

    // Avatar preview state
    let avatarPreview = $state<string | null>(user.image ?? null);
    let fileInput: HTMLInputElement | null = $state(null);
    function handleAvatarChange(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                avatarPreview = e.target?.result as string;
            };
            reader.readAsDataURL(file);

            // Reset removeAvatar flag when new avatar is selected
            $formData.removeAvatar = false;
        }
    }

    function removeAvatar() {
        // Clear the file input
        if (fileInput) {
            fileInput.value = "";
        }
        // Clear the file proxy
        $avatarFileProxy = null;
        // Reset preview to default
        avatarPreview = "/favicon.png";
        // Set a flag to indicate avatar should be removed
        $formData.removeAvatar = true;
    }
    function resetForm() {
        // Reset SuperForm to original user data
        form.reset();

        // Reset avatar-related state
        avatarPreview = user.image ?? null;

        // Reset removeAvatar flag
        $formData.removeAvatar = false;

        // Clear the file input
        if (fileInput) {
            fileInput.value = "";
        }
    }

    const formatDate = (dateString: string | Date | undefined) => {
        if (!dateString) return "N/A";
        const date = typeof dateString === "string" ? new Date(dateString) : dateString;
        return date.toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };
</script>

<main class="flex h-full flex-col space-y-8 p-6">
    <h1 class="text-3xl font-bold">Profile</h1>
    <form method="POST" action="?/updateProfile" enctype="multipart/form-data" use:enhance class="space-y-6">
        <!-- Hidden input for removeAvatar flag -->
        <input type="hidden" name="removeAvatar" bind:value={$formData.removeAvatar} />

        {#if $allErrors.length > 0}
            <Alert.Root variant="destructive">
                <CircleAlert class="size-4" />
                <Alert.Title>Erreur{$allErrors.length > 1 && "s"}</Alert.Title>
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
        <div class="space-y-2">
            <h2 class="text-xl font-semibold">Avatar</h2>
            <div class="flex items-center space-x-4">
                <Avatar.Root class="h-24 w-24">
                    <Avatar.Image
                        src={avatarPreview ?? "/favicon.png"}
                        alt={user.name ?? "User avatar"}
                        class="object-cover object-center" />
                    <Avatar.Fallback>{user.name?.charAt(0).toUpperCase() ?? "U"}</Avatar.Fallback>
                </Avatar.Root>
                <div class="flex gap-2">
                    <Button type="button" variant="outline" onclick={() => fileInput?.click()} disabled={$submitting}>
                        Changer l'avatar
                    </Button>
                    {#if avatarPreview && avatarPreview !== "/favicon.png"}
                        <Button type="button" variant="outline" onclick={removeAvatar} disabled={$submitting}>
                            Supprimer l'avatar
                        </Button>
                    {/if}
                    <input
                        bind:this={fileInput}
                        id="avatar-upload"
                        name="avatarFile"
                        type="file"
                        class="sr-only"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        bind:files={$avatarFileProxy}
                        onchange={handleAvatarChange} />
                </div>
            </div>
            {#if $allErrors.find((error) => error.path.includes("avatarFile"))}
                <div class="text-sm text-destructive">
                    {$allErrors.find((error) => error.path.includes("avatarFile"))?.messages.join(". ")}
                </div>
            {/if}
        </div>
        <Form.Field {form} name="displayName">
            <Form.Control>
                {#snippet children({ props })}
                    <Label for="displayName" class="text-xl font-semibold">Nom d'affichage</Label>
                    <Input
                        {...props}
                        bind:value={$formData.displayName}
                        placeholder="Entrez votre nom d'affichage"
                        class="max-w-sm"
                        disabled={$submitting} />
                {/snippet}
            </Form.Control>
            <Form.FieldErrors />
        </Form.Field>

        <div class="space-y-2">
            <h2 class="text-xl font-semibold">Membre depuis</h2>
            <p class="text-muted-foreground">{formatDate(user.createdAt)}</p>
        </div>

        <div class="space-y-2">
            <h2 class="text-xl font-semibold">Email</h2>
            <p class="text-muted-foreground">{user.email}</p>
        </div>

        <div class="mt-4 flex gap-4">
            <Form.Button disabled={$submitting}>
                {#if $submitting}
                    Enregistrement...
                {:else}
                    Enregistrer les modifications
                {/if}
            </Form.Button>
            <Button type="button" variant="outline" onclick={resetForm} disabled={$submitting}>Annuler</Button>
        </div>

        {#if browser && import.meta.env.DEV}
            <SuperDebug data={$formData} />
        {/if}
    </form>
</main>
