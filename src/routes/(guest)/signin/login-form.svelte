<script lang="ts">
    import { goto } from "$app/navigation";
    import * as Form from "$lib/components/ui/form";
    import * as Alert from "$lib/components/ui/alert";
    import * as Card from "$lib/components/ui/card/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import { loginFormSchema, type LoginFormSchema } from "$src/routes/(guest)/schemas";
    import GlowBar from "../../../lib/components/custom/GlowBar.svelte";
    import NcorpGlitch from "../../../lib/components/custom/NcorpGlitch.svelte";
    import { CircleAlert, CloudDownload, DownloadCloud } from "@lucide/svelte";
    import { toast } from "svelte-sonner";
    import { type SuperValidated, type Infer, superForm } from "sveltekit-superforms";
    import { zod4Client } from "sveltekit-superforms/adapters";
    import LazyImage from "$src/lib/components/custom/LazyImage.svelte";
    import { t } from "$src/lib/translations";
    import Loader from "$src/lib/components/custom/Loader.svelte";
    import Separator from "$src/lib/components/ui/separator/separator.svelte";

    const { data }: { data: SuperValidated<Infer<LoginFormSchema>> } = $props();
    const form = superForm(data, {
        validators: zod4Client(loginFormSchema),
        onResult: async (result) => {
            if (result.result.type === "success") {
                toast.success("Connexion réussie", {
                    class: "bg-green-500",
                });
            } else if (result.result.type === "redirect") {
                goto(result.result.location);
            } else if (result.result.type === "error") {
                toast.error("Erreur lors de la connexion : " + JSON.stringify(result.result.error), {
                    class: "bg-red-500",
                });
            }
        },
    });

    const { form: formData, enhance, submitting, delayed, allErrors } = form;
</script>

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
                        {$t("welcome_to_the")}
                        <NcorpGlitch class="inline-block font-clash font-semibold" text="NCORP" />
                    </div>
                </div>
            </div>
            <GlowBar animate={true} class="hidden w-2/3 dark:block" />
        </Card.Title>
        <Card.Description class="text-center py-4">{$t("login_to_access_content")}</Card.Description>
    </Card.Header>
    <Card.Content>
        <form method="POST" class="grid gap-4" use:enhance>
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
            <Form.Field {form} name="username">
                <Form.Control>
                    {#snippet children({ props })}
                        <Label for="username">{$t("username")}</Label>
                        <Input {...props} bind:value={$formData.username} id="username" type="username" />
                    {/snippet}
                </Form.Control>
                <Form.FieldErrors />
            </Form.Field>

            <Form.Field {form} name="password">
                <Form.Control>
                    {#snippet children({ props })}
                        <div class="flex items-center">
                            <Label for="password">{$t("password")}</Label>
                            <!-- <a href="/reset-pwd" tabindex="-1" class="ml-auto inline-block text-sm underline">
                                {$t("forgot_password")} ?
                            </a> -->
                        </div>
                        <Input {...props} id="password" bind:value={$formData.password} type="password" />
                    {/snippet}
                </Form.Control>
                <Form.FieldErrors />
            </Form.Field>
            <Form.Button disabled={$submitting || $delayed} type="submit" class="w-full">
                {#if $submitting || $delayed}
                    <Loader size={24} />
                {:else}
                    {$t("login")}
                {/if}
            </Form.Button>
        </form>
        <div class="m-4 text-center text-sm">
            {$t("no_account_yet")} ?
            <a href="/signup" class="underline">{$t("create_account")}</a>
        </div>
        <Separator class="my-4" />
        <div class="px-4 pb-2 text-center">
            <a
                href="https://dl.n-corp.fr/agent/updates/NCorp.Agent-win-Setup.exe"
                class="mx-auto w-full text-center text-sm text-primary underline">
                <CloudDownload class="mr-1 inline-block" />
                Télécharger l'agent
            </a>
        </div>
    </Card.Content>
</div>
