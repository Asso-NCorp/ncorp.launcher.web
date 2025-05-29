<script lang="ts">
    import { CircleAlertIcon } from "@lucide/svelte";
    import * as Alert from "$lib/components/ui/alert/index.js";
    import Typewriter from "svelte-typewriter";
    import dayjs from "dayjs";
    import customParseFormat from "dayjs/plugin/customParseFormat";

    dayjs.extend(customParseFormat);
    interface Props {
        globalSettings?: Array<{
            id: number;
            key: string;
            value: string | null;
            created_at: Date;
            updated_at: Date;
            created_by: string;
            updated_by: string;
        }>;
    }

    let { globalSettings }: Props = $props();
    const headerMessage = $derived(
        globalSettings?.find((setting) => setting.key === "header_message")?.value ?? undefined,
    );

    const headerMessageExpiry = $derived(
        globalSettings?.find((setting) => setting.key === "header_message_expiry")?.value ?? undefined,
    );

    const parsedExpiry = $derived(headerMessageExpiry ? dayjs(headerMessageExpiry, "DD/MM/YYYY HH:mm:ss") : null);

    const now = $derived(dayjs());

    const shouldShowMessage = $derived(headerMessage && (!headerMessageExpiry || now.isBefore(parsedExpiry)));

    const isExpiryInvalid = $derived(headerMessageExpiry && parsedExpiry && !parsedExpiry.isValid());
</script>

{#if globalSettings}
    {#if shouldShowMessage}
        <Alert.Root class="pointer-events-none w-[32rem] max-w-lg border-0 border-l bg-secondary p-2">
            <CircleAlertIcon class="size-4" />
            <Alert.Description class="text-pretty text-justify text-xs text-muted-foreground">
                <Typewriter interval={5} cursor={false}>
                    <span>{headerMessage}</span>
                </Typewriter>
            </Alert.Description>
        </Alert.Root>
    {:else if isExpiryInvalid}
        <div class="text-red-500">
            Date d'expiration du message invalide: {headerMessageExpiry}
        </div>
    {/if}
{/if}
