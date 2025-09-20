<script lang="ts">
    import { onMount } from "svelte";
    import { authClient } from "$lib/auth/client";

    let session: any = null;

    onMount(async () => {
        session = await authClient.getSession();
        console.log("AccessToken:", session?.accessToken);
        console.log("IDToken:", session?.idToken);
        console.log("User:", session?.user);
    });
</script>

{#if session}
    <p>Bienvenue {session.user?.username}</p>
{:else}
    <p>Connexion en cours...</p>
{/if}
