<script lang="ts">
    import * as Form from "$lib/components/ui/form";
    import * as Card from "$lib/components/ui/card/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import { forgotPasswordSchema, type ForgotPasswordSchema } from "../schemas";
    import { superForm, type SuperValidated, type Infer } from "sveltekit-superforms";
    import { zod4Client } from "sveltekit-superforms/adapters";
    import { authClient } from "$src/lib/auth/client";
    import { toast } from "svelte-sonner";
    import SquareCard from "$src/lib/components/custom/admin/SquareCard.svelte";
    import BackgroundBeams from "$src/lib/components/custom/BackgroundBeams.svelte";
    import Loader from "$src/lib/components/custom/Loader.svelte";
    import LazyImage from "$src/lib/components/custom/LazyImage.svelte";
    import { t } from "$src/lib/translations";
    import NcorpGlitch from "$src/lib/components/custom/NcorpGlitch.svelte";
    import GlowBar from "$src/lib/components/custom/GlowBar.svelte";

    let { data }: { data: { form: SuperValidated<Infer<ForgotPasswordSchema>> } } = $props();

    const form = superForm(data.form, {
        validators: zod4Client(forgotPasswordSchema),
        SPA: true,
        onUpdate: async ({ form }) => {
            if (form.valid) {
                const { email } = form.data;
                try {
                    const { data, error } = await authClient.requestPasswordReset({
                        email,
                        redirectTo: "/reset-password",
                    });
                    if (error) {
                        toast.error(error.message || "An error occurred");
                    } else {
                        toast.success($t("reset_link_sent"));
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
                            {$t("forgot_password")}
                        </div>
                    </div>
                </div>
                <GlowBar animate={true} class="hidden w-2/3 dark:block" />
            </Card.Title>
            <Card.Description class="text-center py-4">
                {$t("enter_email_to_reset_password")}
            </Card.Description>
        </Card.Header>
        <Card.Content>
            <form method="POST" class="grid gap-4" use:enhance>
                <Form.Field {form} name="email">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Label for="email">{$t("email")}</Label>
                            <Input {...props} bind:value={$formData.email} id="email" type="email" placeholder="name@example.com" />
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>

                <Form.Button disabled={$submitting} class="w-full">
                    {#if $submitting}
                        <Loader class="mr-2 h-4 w-4 animate-spin" />
                    {/if}
                    {$t("send_reset_link")}
                </Form.Button>
                <div class="mt-4 text-center text-sm">
                    <a href="/signin" class="underline">
                        {$t("back_to_signin")}
                    </a>
                </div>
            </form>
        </Card.Content>
    </div>
</SquareCard>
