<script lang="ts">
    import SquareCard from "$src/lib/components/custom/admin/SquareCard.svelte";
    import BackgroundBeams from "$src/lib/components/custom/BackgroundBeams.svelte";
    import type { PageData } from "./$types.js";
    import SignupForm from "./signup-form.svelte";

    let { data }: { data: PageData } = $props();
</script>

<SquareCard class="flex items-center justify-center">
    <BackgroundBeams class="hidden sm:block sm:bg-card/80" />
    <SignupForm data={data.form} />
</SquareCard>