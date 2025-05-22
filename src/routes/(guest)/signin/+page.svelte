<script lang="ts">
    import SquareCard from "$src/lib/components/custom/admin/SquareCard.svelte";
    import BackgroundBeams from "$src/lib/components/custom/BackgroundBeams.svelte";
    import type { PageData } from "./$types.js";
    import LoginForm from "./login-form.svelte";

    let { data }: { data: PageData } = $props();
</script>

<SquareCard class="flex h-auto w-full items-center justify-center px-4">
    <BackgroundBeams class="bg-card/80" />
    <LoginForm data={data.form} />
</SquareCard>
