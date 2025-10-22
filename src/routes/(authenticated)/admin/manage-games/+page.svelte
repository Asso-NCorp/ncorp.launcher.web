<script lang="ts">
    import type { PageData } from "./$types";
    import AddgameForm from "./addgame-form.svelte";
    import { GamesStore } from "$src/lib/states/games.svelte";
    import { onMount } from "svelte";

    let { data }: { data: PageData } = $props();

    onMount(async () => {
        await GamesStore.getAvailableGames();
    });
</script>

<div>
    <AddgameForm {data} />
</div>
