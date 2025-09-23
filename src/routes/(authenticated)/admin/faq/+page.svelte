<script lang="ts">
    import { Card, CardContent, CardHeader, CardTitle } from "$src/lib/components/ui/card";
    import { Label } from "$src/lib/components/ui/label";
    import { Input } from "$src/lib/components/ui/input";
    import { Checkbox } from "$src/lib/components/ui/checkbox";
    import { Button } from "$src/lib/components/ui/button";
    import * as Select from "$src/lib/components/ui/select";
    import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogTrigger } from "$src/lib/components/ui/alert-dialog";
    import { enhance } from "$app/forms";
    import { invalidateAll } from "$app/navigation";
    import { onMount, onDestroy } from "svelte";

    import type { Crepe } from "@milkdown/crepe";
    import "@milkdown/crepe/theme/common/style.css";
    import { Cloud } from "@lucide/svelte";
    const { data } = $props() as {
        data: { faqs: Array<{ id: number; question: string; answer: string; published: boolean }> };
    };

    let editorRoot: HTMLDivElement;
    let crepe: Crepe | undefined;
    let editId = $state<number | null>(null);
    let question = $state("");
    let published = $state(true);
    let selectedId = $state<string | undefined>(undefined);
    const currentFaq = $derived(editId ? data.faqs.find((f) => f.id === editId) ?? null : null);

    // Fonction d’upload
    async function uploadToBackend(file: File): Promise<string> {
        console.log("Uploading file:", file.name);
        // ⚠️ test: placeholder URL
        return "https://placehold.co/400";
    }

    // import dynamique

    async function initEditor(defaultValue: string) {
        if (typeof window === "undefined" || !editorRoot) return;
        const { Crepe } = await import("@milkdown/crepe");
        // destroy previous instance if any
        if (crepe) {
            try {
                crepe.destroy();
            } catch {}
        }
        crepe = new Crepe({
            root: editorRoot!,
            defaultValue,
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
        const view: any = crepe.editor.ctx.get("editorView");
        view.setProps({
            handleDOMEvents: {
                paste(view: any, event: ClipboardEvent) {
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
    }

    onMount(async () => {
        await initEditor("");
    });

    onDestroy(() => {
        crepe?.destroy();
    });

    $effect(() => {
        if (selectedId) {
            const idNum = Number(selectedId);
            const target = data.faqs.find((f) => f.id === idNum);
            if (target) openEdit(target);
        }
    });

    async function setEditorMarkdown(md: string) {
        const hasSetter = (crepe as any)?.setMarkdown && typeof (crepe as any).setMarkdown === "function";
        if (hasSetter) {
            try {
                (crepe as any).setMarkdown(md);
                return;
            } catch {}
        }
        await initEditor(md);
    }

    async function openEdit(faq: { id: number; question: string; answer: string; published: boolean }) {
        editId = faq.id;
        question = faq.question;
        published = faq.published;
        await setEditorMarkdown(faq.answer);
        // Optionally scroll to the editor
        editorRoot?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function cancelEdit() {
        editId = null;
        question = "";
        published = true;
        // leave editor content as-is for convenience
    selectedId = undefined;
    }

    // SvelteKit progressive enhancement for forms (no full reload)
    function onFormSubmit({ formData }: { formData: FormData }) {
        if (crepe) {
            const md = crepe.getMarkdown();
            formData.set("answer", md);
        }
        return async ({ result, update }: { result: any; update: (opts?: { reset?: boolean; invalidateAll?: boolean }) => Promise<void> }) => {
            // If the action redirected, handle it manually to avoid navigation
            if (result?.type === "redirect") {
                await invalidateAll();
            } else {
                await update({ invalidateAll: true });
            }
            // If we were editing, exit edit mode; otherwise, clear inputs
            if (editId) {
                cancelEdit();
            } else {
                question = "";
                published = true;
            }
        };
    }

    function onSimpleSubmit({ action }: { action: URL }) {
        return async ({ result, update }: { result: any; update: (opts?: { reset?: boolean; invalidateAll?: boolean }) => Promise<void> }) => {
            const isDelete = action.href.includes("?/delete");
            if (result?.type === "redirect") {
                await invalidateAll();
            } else {
                await update({ invalidateAll: true });
            }
            if (isDelete) {
                cancelEdit();
            }
        };
    }

    // Edit submit flows through the same top form; keep a simple handler for other forms
</script>

<section class="mx-auto max-w-6xl space-y-6 p-4">
    <h1 class="text-2xl font-bold">Gérer la FAQ</h1>

    <!-- Sélection de l'entrée à éditer / création -->
    <Card>
        <CardHeader>
            <CardTitle>{editId ? "Modifier l'entrée" : "Créer une nouvelle entrée"}</CardTitle>
        </CardHeader>
        <CardContent>
            <div class="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div class="md:col-span-2">
                    <Label>Choisir une entrée existante</Label>
                    <div class="mt-1">
                        <Select.Root type="single" bind:value={selectedId}>
                            <Select.Trigger class="w-full"></Select.Trigger>
                            <Select.Content>
                                {#each data.faqs as f}
                                    <Select.Item value={String(f.id)}>{f.question}</Select.Item>
                                {/each}
                            </Select.Content>
                        </Select.Root>
                    </div>
                </div>
                <div class="flex items-end gap-2">
                    <Button type="button" variant="secondary" onclick={() => cancelEdit()}>Nouvelle</Button>
                    {#if currentFaq}
                        <form method="post" action="?/move" use:enhance={onSimpleSubmit}>
                            <input type="hidden" name="id" value={currentFaq.id} />
                            <input type="hidden" name="direction" value="up" />
                            <Button type="submit" variant="outline">↑ Monter</Button>
                        </form>
                        <form method="post" action="?/move" use:enhance={onSimpleSubmit}>
                            <input type="hidden" name="id" value={currentFaq.id} />
                            <input type="hidden" name="direction" value="down" />
                            <Button type="submit" variant="outline">↓ Descendre</Button>
                        </form>
                    {/if}
                </div>
            </div>

            <form method="post" action={editId ? "?/update" : "?/create"} use:enhance={onFormSubmit} class="grid gap-4">
                {#if editId}
                    <input type="hidden" name="id" value={editId} />
                {/if}
                <div class="grid gap-1">
                    <Label for="question">Question</Label>
                    <Input id="question" name="question" bind:value={question} required />
                </div>

                <div class="grid gap-1">
                    <Label for="answer">Réponse</Label>
                    <div class="crepe rounded-md border p-2">
                        <div bind:this={editorRoot}></div>
                    </div>
                </div>

                <input type="hidden" name="answer" />

                <label class="inline-flex items-center gap-2">
                    <Checkbox name="published" bind:checked={published} />
                    <span>Publiée</span>
                </label>

                <div>
                    <Button type="submit">{editId ? "Enregistrer" : "Créer"}</Button>
                    {#if editId}
                        <Button type="button" variant="secondary" class="ml-2" onclick={cancelEdit}>Annuler</Button>
                    {/if}
                </div>
            </form>
        </CardContent>
    </Card>

    <!-- Actions sur l'entrée sélectionnée -->
    {#if currentFaq}
        <div class="mt-4 flex flex-wrap items-center gap-2">
            <form method="post" action="?/toggle" use:enhance={onSimpleSubmit}>
                <input type="hidden" name="id" value={currentFaq.id} />
                <Button type="submit" variant={published ? "outline" : "default"}>{published ? "Masquer" : "Publier"}</Button>
            </form>
            <AlertDialog>
                <AlertDialogTrigger>
                    <Button variant="destructive">Supprimer</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette entrée ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. L'entrée sélectionnée sera supprimée définitivement.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <form method="post" action="?/delete" use:enhance={onSimpleSubmit}>
                            <input type="hidden" name="id" value={currentFaq.id} />
                            <Button type="submit" variant="destructive">Confirmer</Button>
                        </form>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    {/if}

    <!-- No separate dialog; editing uses the main editor form above -->
</section>

<style>
    :global(.milkdown) {
        /* Backgrounds & surfaces */
        --crepe-color-background: var(--background);
        --crepe-color-on-background: var(--foreground);
        --crepe-color-surface: var(--card);
        --crepe-color-surface-low: var(--background-subtle);
        --crepe-color-on-surface: var(--card-foreground);
        --crepe-color-on-surface-variant: var(--muted-foreground);
        --crepe-color-outline: var(--border); /* Palette */
        --crepe-color-primary: var(--primary);
        --crepe-color-secondary: var(--secondary);
        --crepe-color-on-secondary: var(--secondary-foreground); /* Inverse (mode contrasté) */
        --crepe-color-inverse: var(--foreground);
        --crepe-color-on-inverse: var(--background); /* Inline & état */
        --crepe-color-inline-code: var(--accent);
        --crepe-color-error: var(--destructive);
        --crepe-color-hover: var(--muted);
        --crepe-color-selected: var(--secondary);
        --crepe-color-inline-area: var(--popover); /* Fonts */
        --crepe-font-title: Rubik, Cambria, "Times New Roman", Times, serif;
        --crepe-font-default: Inter, Rubik, system-ui, sans-serif;
        --crepe-font-code:
            "JetBrains Mono", Menlo, Monaco, "Courier New", monospace; /* Shadows (recolorisées avec ton token border) */
        --crepe-shadow-1: 0px 1px 2px 0px var(--border) / 0.3, 0px 1px 3px 1px var(--border) / 0.15;
        --crepe-shadow-2:
            0px 1px 2px 0px var(--border) / 0.3, 0px 2px 6px 2px var(--border) / 0.15; /* Radius */
        --crepe-radius: var(--radius);
    }
    :global(.milkdown .ProseMirror) {
        min-height: 220px;
        padding: 0.25rem 4rem;
    }
</style>
