<script lang="ts">
    import * as Form from "$lib/components/ui/form";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Textarea } from "$lib/components/ui/textarea";
    import { Checkbox } from "$lib/components/ui/checkbox";
    import { t } from "$src/lib/translations";
    import SearchDropdown from "$src/lib/components/custom/dropdowns/SearchDropdown.svelte";
    import { Button } from "../ui/button";
    import { Calculator, RefreshCw } from "@lucide/svelte";
    import { getServerApi } from "$src/lib/utils";
    import { global } from "$src/lib/states/global.svelte";
    import * as Tooltip from "$lib/components/ui/tooltip/index.js";
    import Loader from "../custom/Loader.svelte";

    // Props
    const {
        form, // Form reference for validation
        folders = [],
        formData = undefined,
    } = $props<{
        form: any;
        folders?: string[];
        formData?: any; // Access to the form data
    }>();

    const serverApi = getServerApi();
    let gameFolders = $state(folders);

    let translating = $state(false);
    const handleTranslateDescription = async () => {
        try {
            translating = true;
            const result = await fetch("/api/translate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ text: $formData.description }),
            });
            const translatedText = await result.text();
            $formData.description = translatedText;
        } catch (error) {
        } finally {
            translating = false;
        }
    };

    const handleRefreshFolders = async () => {
        try {
            gameFolders = await serverApi.getFolders();
        } catch (error) {
            console.error(error);
        }
    };

    let isFetchingSize = $state(false);
    const handleGetFolderSize = async () => {
        isFetchingSize = true;
        try {
            const size = await serverApi.getGameSize({
                gameSlug: $formData.folderSlug,
            });
            $formData.sizeGb = size;
        } catch (error) {
            console.error(error);
        } finally {
            isFetchingSize = false;
        }
    };
</script>

<Form.Field {form} name="folderSlug">
    <Form.Control>
        {#snippet children()}
            <div class="flex gap-2">
                <SearchDropdown options={gameFolders} bind:value={$formData.folderSlug} />
                <Button onclick={handleRefreshFolders} variant="outline"><RefreshCw /></Button>
            </div>
        {/snippet}
    </Form.Control>
    <Form.FieldErrors />
</Form.Field>

<Form.Field {form} name="description">
    <Form.Control>
        {#snippet children({ props })}
            <Label for="description">{$t("description")}</Label>
            <Textarea {...props} disabled={translating} class="h-32 resize-none" bind:value={$formData.description} />
        {/snippet}
    </Form.Control>
    <Button onclick={handleTranslateDescription} disabled={translating} variant="outline">Traduire</Button>
    <Form.FieldErrors />
</Form.Field>

<Form.Field {form} name="sizeGb">
    <Form.Control>
        {#snippet children({ props })}
            <Label for="sizeGb">{$t("size")} (Go)</Label>
            <div class="flex gap-2">
                <Input {...props} bind:value={$formData.sizeGb} />
                <Tooltip.Root>
                    <Tooltip.Trigger>
                        <Button
                            disabled={isFetchingSize || !$formData.folderSlug}
                            size="icon"
                            variant="outline"
                            onclick={handleGetFolderSize}>
                            {#if isFetchingSize}
                                <Loader size={16}></Loader>
                            {:else}
                                <Calculator />
                            {/if}
                        </Button>
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                        <p>Calculer la taille</p>
                    </Tooltip.Content>
                </Tooltip.Root>
            </div>
        {/snippet}
    </Form.Control>
    <Form.FieldErrors />
</Form.Field>

<Form.Field {form} name="useNotifications">
    <Form.Control>
        {#snippet children({ props })}
            <Label for="useNotifications" title="Si oui, vous pourrez voir qui lance/installe ce jeu">
                Notifications de lancement/installation
            </Label>
            <Checkbox {...props} bind:checked={$formData.useNotifications} />
        {/snippet}
    </Form.Control>
    <Form.FieldErrors />
</Form.Field>

<Form.Field {form} name="maxPlayers">
    <Form.Control>
        {#snippet children({ props })}
            <Label for="maxPlayers">{$t("max_players")}</Label>
            <Input {...props} type="number" bind:value={$formData.maxPlayers} />
        {/snippet}
    </Form.Control>
    <Form.FieldErrors />
</Form.Field>

<Form.Field {form} name="startCommand">
    <Form.Control>
        {#snippet children({ props })}
            <Label for="startCommand">{$t("start_command")}</Label>
            <Input {...props} bind:value={$formData.startCommand} />
        {/snippet}
    </Form.Control>
    <Form.FieldErrors />
</Form.Field>

<Form.Field {form} name="mainProcessName">
    <Form.Control>
        {#snippet children({ props })}
            <Label for="mainProcessName">{$t("main_process_name")}</Label>
            <Input {...props} bind:value={$formData.mainProcessName} />
        {/snippet}
    </Form.Control>
    <Form.FieldErrors />
</Form.Field>
