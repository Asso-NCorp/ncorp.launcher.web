<script lang="ts">
    import { Alert, AlertDescription, AlertTitle } from "$src/lib/components/ui/alert";
    import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "$src/lib/components/ui/accordion";

    const { data } = $props<{ faqs: Array<{ id: number; question: string; answer: string }> }>();

    // Composant dynamique
    let ReadonlyMarkdown = $state<null | typeof import("$src/lib/components/ReadonlyMarkdown.svelte").default>(null);

    async function loadViewer() {
        if (!ReadonlyMarkdown) {
            const mod = await import("$src/lib/components/ReadonlyMarkdown.svelte");
            ReadonlyMarkdown = mod.default;
        }
    }
</script>

<section class="mx-auto max-w-6xl space-y-6 p-4">
    <h1 class="text-2xl font-bold">FAQ</h1>

    {#if data.faqs.length === 0}
        <Alert>
            <AlertTitle>Aucune question pour le moment</AlertTitle>
            <AlertDescription>Nous ajouterons ici des réponses aux questions fréquentes.</AlertDescription>
        </Alert>
    {:else}
        <Accordion type="single" class="w-full">
            {#each data.faqs as faq (faq.id)}
                <AccordionItem value={`faq-${faq.id}`}>
                    <!-- on charge ReadonlyMarkdown à l’ouverture -->
                    <AccordionTrigger onclick={loadViewer}>
                        {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>
                        {#if ReadonlyMarkdown}
                            <ReadonlyMarkdown content={faq.answer} />
                        {:else}
                            <p class="text-sm italic text-muted-foreground">Chargement…</p>
                        {/if}
                    </AccordionContent>
                </AccordionItem>
            {/each}
        </Accordion>
    {/if}
</section>
