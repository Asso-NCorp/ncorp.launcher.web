<script lang="ts">
    import * as Form from "$lib/components/ui/form";
    import * as Card from "$lib/components/ui/card/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import { resetPasswordSchema, type ResetPasswordSchema } from "../schemas";
    import { superForm, type SuperValidated, type Infer } from "sveltekit-superforms";
    import { zod4Client } from "sveltekit-superforms/adapters";
    import { authClient } from "$src/lib/auth/client";
    import { toast } from "svelte-sonner";
    import SquareCard from "$src/lib/components/custom/admin/SquareCard.svelte";
    import BackgroundBeams from "$src/lib/components/custom/BackgroundBeams.svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import Loader from "$src/lib/components/custom/Loader.svelte";
    import LazyImage from "$src/lib/components/custom/LazyImage.svelte";
    import { t } from "$src/lib/translations";
    import NcorpGlitch from "$src/lib/components/custom/NcorpGlitch.svelte";
    import GlowBar from "$src/lib/components/custom/GlowBar.svelte";

    let { data }: { data: { form: SuperValidated<Infer<ResetPasswordSchema>> } } = $props();

    const form = superForm(data.form, {
        validators: zod4Client(resetPasswordSchema),
        SPA: true,
        onUpdate: async ({ form }) => {
            if (form.valid) {
                const { password } = form.data;
                const token = $page.url.searchParams.get("token");
                const errorParam = $page.url.searchParams.get("error");

                if (errorParam) {
                     toast.error($t("invalid_token"));
                     return;
                }

                if (!token) {
                    toast.error($t("missing_token"));
                    return;
                }

                try {
                    const { data, error } = await authClient.resetPassword({
                        newPassword: password,
                        token,
                    });
                    if (error) {
                        toast.error(error.message || "An error occurred");
                    } else {
                        toast.success($t("password_reset_success"));
                        goto("/signin");
                    }
                } catch (e) {
                    toast.error("An unexpected error occurred");
                }
            }
        },
    });

    const { form: formData, enhance, submitting } = form;
</script>

<SquareCard class="flex h-auto w-auto justify-center px-4">
    <BackgroundBeams class="hidden sm:block sm:bg-card/80" />
    <div class="mx-auto w-96 scale-110 p-6">
        <Card.Header>
            <Card.Title class="text-center text-2xl">
                <div class="flex items-center justify-center gap-3">
                    <LazyImage
                        placeholderHeight="58px"
                        placeholderWidth="50px"
                        imageHeight="58px"
                        imageWidth="50px"
                        src="/logo_small.png"
                        alt="NCORP LOGO" />
                    <!-- Barre verticale -->
                    <div class="h-[58px] w-px bg-[hsl(var(--border))]"></div>
                    <div class="inline-flex items-center justify-center py-2 text-2xl font-bold">
                        <div>
                            {$t("reset_password_title")}
                        </div>
                    </div>
                </div>
                <GlowBar animate={true} class="hidden w-2/3 dark:block" />
            </Card.Title>
            <Card.Description class="text-center py-4">
                {$t("enter_new_password")}
            </Card.Description>
        </Card.Header>
        <Card.Content>
            <form method="POST" class="grid gap-4" use:enhance>
                <Form.Field {form} name="password">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="password">{$t("new_password")}</Label>
                            <Input {...props} bind:value={$formData.password} id="password" type="password" />
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>

                <Form.Field {form} name="confirmPassword">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="confirmPassword">{$t("confirm_password")}</Label>
                            <Input {...props} bind:value={$formData.confirmPassword} id="confirmPassword" type="password" />
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>

                <Form.Button disabled={$submitting} class="w-full">
                    {#if $submitting}
                        <Loader class="mr-2 h-4 w-4 animate-spin" />
                    {/if}
                    {$t("reset_password_button")}
                </Form.Button>
            </form>
        </Card.Content>
    </div>
</SquareCard>
