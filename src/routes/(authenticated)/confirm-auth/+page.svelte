<script lang="ts">
    import { onMount } from "svelte";
    import type { PageData } from "./$types";
    import { getLocalApi } from "$src/lib/utils";
    import Loader from "$src/lib/components/custom/Loader.svelte";
    import { goto } from "$app/navigation";

    let { data }: { data: PageData } = $props();

    onMount(async () => {
        try {
            await getLocalApi().authenticate();
        } catch (error) {
            console.error(error);
        }

        window.location.href = "/";
    });
</script>

<div class="flex h-full w-full items-center justify-center">
    <Loader size={40} />
</div>
