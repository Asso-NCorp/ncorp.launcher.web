<script lang="ts">
    import { Card, CardContent, CardHeader, CardTitle } from "$src/lib/components/ui/card";
    import { Label } from "$src/lib/components/ui/label";
    import { Input } from "$src/lib/components/ui/input";
    import { Checkbox } from "$src/lib/components/ui/checkbox";
    import { Button } from "$src/lib/components/ui/button";
    import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "$src/lib/components/ui/accordion";
    import { onMount, onDestroy } from "svelte";

    import type { Crepe } from "@milkdown/crepe";
    import "@milkdown/crepe/theme/common/style.css";
    const { data } = $props() as {
        data: { faqs: Array<{ id: number; question: string; answer: string; published: boolean }> };
    };

    let editorRoot: HTMLDivElement;
    let crepe: Crepe | undefined;

    // Fonction d’upload (à remplacer par ton backend)
    async function uploadToBackend(file: File): Promise<string> {
        console.log("Uploading file:", file.name);
        // ⚠️ test: placeholder URL
        return "https://placehold.co/400";
    }

    // import dynamique
    let ReadonlyMarkdown = $state<null | typeof import("$src/lib/components/ReadonlyMarkdown.svelte").default>(null);

    async function loadViewer() {
        if (!ReadonlyMarkdown) {
            const mod = await import("$src/lib/components/ReadonlyMarkdown.svelte");
            ReadonlyMarkdown = mod.default;
        }
    }

    onMount(async () => {
        if (typeof window === "undefined") return;
        const { Crepe } = await import("@milkdown/crepe");

        crepe = new Crepe({
            root: editorRoot!,
            defaultValue: "",
            features: {
                "image-block": true,
            },
            featureConfigs: {
                "image-block": {
                    blockOnUpload: uploadToBackend,
                    inlineOnUpload: uploadToBackend,
                    onUpload: uploadToBackend,
                },
            },
        });

        await crepe.create();

        // Récupérer editorView depuis le contexte
        const view = crepe.editor.ctx.get("editorView");

        // Patch paste handler via ProseMirror API
        view.setProps({
            handleDOMEvents: {
                paste(view, event: ClipboardEvent) {
                    const items = event.clipboardData?.items;
                    if (!items) return false;

                    for (const item of items) {
                        if (item.type.startsWith("image/")) {
                            const file = item.getAsFile();
                            if (!file) continue;

                            uploadToBackend(file).then((url) => {
                                const { state, dispatch } = view;
                                const { schema } = state;
                                const node = schema.nodes.image.create({ src: url });
                                if (node) {
                                    dispatch(state.tr.replaceSelectionWith(node));
                                }
                            });

                            event.preventDefault();
                            return true;
                        }
                    }
                    return false;
                },
            },
        });
    });

    onDestroy(() => {
        crepe?.destroy();
    });

    // Enhance form
    function enhance(form: HTMLFormElement) {
        async function handleSubmit(event: SubmitEvent) {
            event.preventDefault();

            const data = new FormData(form);

            if (crepe) {
                const md = crepe.getMarkdown();
                console.log("Submitting FAQ with answer:", md);
                data.set("answer", md);
            }

            const res = await fetch(form.action, {
                method: form.method,
                body: data,
            });

            if (res.ok) {
                window.location.reload();
            } else {
                console.error("Erreur lors de la création de la FAQ");
            }
        }

        form.addEventListener("submit", handleSubmit);

        return {
            destroy: () => form.removeEventListener("submit", handleSubmit),
        };
    }
</script>

<section class="mx-auto max-w-4xl space-y-6 p-4">
    <h1 class="text-2xl font-bold">Gérer la FAQ</h1>

    <!-- Création d’une nouvelle entrée -->
    <Card>
        <CardHeader>
            <CardTitle>Créer une nouvelle entrée</CardTitle>
        </CardHeader>
        <CardContent>
            <form method="post" action="?/create" use:enhance class="grid gap-4">
                <div class="grid gap-1">
                    <Label for="question">Question</Label>
                    <Input id="question" name="question" required />
                </div>

                <div class="grid gap-1">
                    <Label for="answer">Réponse</Label>
                    <div class="crepe rounded-md border p-2">
                        <div bind:this={editorRoot}></div>
                    </div>
                </div>

                <input type="hidden" name="answer" />

                <label class="inline-flex items-center gap-2">
                    <Checkbox name="published" checked />
                    <span>Publiée</span>
                </label>

                <div>
                    <Button type="submit">Créer</Button>
                </div>
            </form>
        </CardContent>
    </Card>

    <!-- Liste des FAQ existantes -->
    <h2 class="text-xl font-semibold">Entrées existantes</h2>
    <div class="space-y-3">
        <Accordion type="single" class="w-full">
            {#each data.faqs as faq (faq.id)}
                <AccordionItem value={`faq-${faq.id}`}>
                    <AccordionTrigger onclick={loadViewer}>
                        <div class="flex w-full items-center justify-between">
                            <span class="text-base font-medium">{faq.question}</span>
                            {#if faq.published}
                                <span class="text-xs text-green-600">Publiée</span>
                            {:else}
                                <span class="text-xs text-yellow-600">Brouillon</span>
                            {/if}
                        </div>
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
    </div>
</section>

<style>
    :global(.milkdown) {
        /* Backgrounds & surfaces */
        --crepe-color-background: hsl(var(--background));
        --crepe-color-on-background: hsl(var(--foreground));
        --crepe-color-surface: hsl(var(--card));
        --crepe-color-surface-low: hsl(var(--background-subtle));
        --crepe-color-on-surface: hsl(var(--card-foreground));
        --crepe-color-on-surface-variant: hsl(var(--muted-foreground));
        --crepe-color-outline: hsl(var(--border)); /* Palette */
        --crepe-color-primary: hsl(var(--primary));
        --crepe-color-secondary: hsl(var(--secondary));
        --crepe-color-on-secondary: hsl(var(--secondary-foreground)); /* Inverse (mode contrasté) */
        --crepe-color-inverse: hsl(var(--foreground));
        --crepe-color-on-inverse: hsl(var(--background)); /* Inline & état */
        --crepe-color-inline-code: hsl(var(--accent));
        --crepe-color-error: hsl(var(--destructive));
        --crepe-color-hover: hsl(var(--muted));
        --crepe-color-selected: hsl(var(--secondary));
        --crepe-color-inline-area: hsl(var(--popover)); /* Fonts */
        --crepe-font-title: Rubik, Cambria, "Times New Roman", Times, serif;
        --crepe-font-default: Inter, Rubik, system-ui, sans-serif;
        --crepe-font-code:
            "JetBrains Mono", Menlo, Monaco, "Courier New", monospace; /* Shadows (recolorisées avec ton token border) */
        --crepe-shadow-1: 0px 1px 2px 0px hsl(var(--border) / 0.3), 0px 1px 3px 1px hsl(var(--border) / 0.15);
        --crepe-shadow-2:
            0px 1px 2px 0px hsl(var(--border) / 0.3), 0px 2px 6px 2px hsl(var(--border) / 0.15); /* Radius */
        --crepe-radius: var(--radius);
    }
    :global(.milkdown .ProseMirror) {
        min-height: 220px;
        padding: 0.25rem 1rem;
    }
</style>
