<script lang="ts">
    import { Toaster } from "$lib/components/ui/sonner";
    import { TooltipProvider } from "$src/lib/components/ui/tooltip";
    import "@fontsource-variable/suse";
    import "$src/app.css";
    import type { LayoutProps } from "./$types";

    let { children }: LayoutProps = $props();
</script>

<TooltipProvider>
    <div class="flex items-center justify-center min-h-screen">
        {@render children()}
    </div>
    <Toaster />
</TooltipProvider>
